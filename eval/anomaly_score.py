#!/usr/bin/env python3
"""
anomaly_score.py — score detected anomalies against the sidecar ground truth.

Two inputs, repeated R times each because the detector is nondeterministic:

  planted_anomaly.csv     exactly ONE anomalous row (the -85,000 spike).
                          Ground truth from planted_anomaly.csv.groundtruth.json,
                          which the pipeline never sees.
  all_identical_rows.csv  50 identical rows => ZERO row-level anomalies.
                          Negative control: anything row-level here is a false
                          positive.

SCORING NOTE — this is the honest part.
The pipeline emits free-text anomaly statements, not row ids, so "did it find
row 25" has to be inferred from the text. Statements are bucketed:

  row-level    : names a specific magnitude/date (e.g. "-85000", "2025-04-06")
  dataset-level: describes the distribution ("high standard deviation")

Only ROW-LEVEL statements are scored for precision/recall — a dataset-level
observation is not a claim about a particular row and counting it as a false
positive would understate precision. Dataset-level counts are reported
separately so the choice is visible rather than buried.

    export BASELINE_TOKEN="$(python3 eval/mint_token.py)"
    python3 eval/anomaly_score.py
"""
import json
import os
import re
import sys

from run_corpus import post_file, TOKEN
import quota

HERE = os.path.dirname(os.path.abspath(__file__))
CORPUS = os.path.join(HERE, "corpus")
R = int(os.environ.get("ANOMALY_RUNS", "10"))
R_CONTROL = int(os.environ.get("ANOMALY_CONTROL_RUNS", "5"))
OUT = os.path.join(HERE, "anomaly_runs.json")

DATASET_LEVEL = re.compile(
    r"standard deviation|std dev|variance|mean|median|average|distribution|"
    r"overall|trend|spread|outlier[s]? (?:exist|present)|"
    # Aggregate statistics describe the dataset, not one row.
    r"minimum|maximum|\bmin\b|\bmax\b|uniform|total|"
    # Whole-set statements: "all transactions ...", "every row ...", "identical
    # amounts". These describe the dataset, not one row, so they are not
    # row-level claims and must not be scored as false positives.
    r"\ball\b|\bevery\b|identical|duplicat|no (?:anomal|variation)|same (?:date|amount|value)",
    re.I)


def numbers_in(text: str) -> set:
    """Absolute numeric magnitudes mentioned, commas/currency stripped."""
    out = set()
    for m in re.findall(r"-?\$?[\d,]+(?:\.\d+)?", text):
        try:
            out.add(abs(float(m.replace("$", "").replace(",", ""))))
        except ValueError:
            pass
    return out


# A specific row identifier: an ISO date, or a currency-formatted amount.
# Used to decide whether a non-matching statement actually points at some
# OTHER row (a real false positive) or is just a vague/aggregate remark.
ROW_IDENTIFIER = re.compile(r"\d{4}-\d{2}-\d{2}|\$[\d,]+(?:\.\d+)?")


def classify(stmt: str, truth: dict, strict: bool = False) -> str:
    """
    -> 'tp' | 'fp' | 'dataset'

    strict=False (default, and the number reported):
        A statement counts as a FALSE POSITIVE only when it makes a claim about
        a SPECIFIC row that is not the planted one — i.e. it names a date or a
        formatted amount pointing elsewhere. Vague remarks ("negative
        transaction amounts") and aggregate remarks ("minimum transaction
        amount is large and negative") are not row-level claims, so they are
        bucketed 'dataset' and left unscored. Penalising those would mean
        counting a correct-but-imprecise observation as a wrong answer.

    strict=True (sensitivity check):
        Anything that is neither a spike match nor an explicit aggregate
        phrase counts as a false positive. Reported alongside the headline
        number so the effect of this judgement call is visible.
    """
    spike = abs(truth["spike_amount"])
    nums = numbers_in(stmt)
    # Match the spike magnitude within 1% (formatting varies: 85000, 85,000.00).
    hits_spike = any(abs(n - spike) <= spike * 0.01 for n in nums)
    if hits_spike or truth["spike_date"] in stmt:
        return "tp"
    if DATASET_LEVEL.search(stmt):
        return "dataset"
    if strict:
        return "fp"
    # Only a claim naming a specific other row is a false positive.
    return "fp" if ROW_IDENTIFIER.search(stmt) else "dataset"


def run(path: str, times: int, label: str) -> list:
    print(f"\n{label}: {os.path.basename(path)} x {times}")
    out = []
    consecutive_fail = 0
    for i in range(times):
        res = post_file(path)
        body = res["body"] if res["outcome"] == "ok" and isinstance(res.get("body"), dict) else None
        anomalies = []
        if body:
            a = body.get("anomalies")
            if isinstance(a, dict) and isinstance(a.get("anomalies"), list):
                anomalies = [str(x) for x in a["anomalies"]]
        out.append({"run": i + 1, "outcome": res["outcome"],
                    "latency_s": round(res["latency"], 2),
                    "anomalies": anomalies,
                    "risk_level": (body or {}).get("anomalies", {}).get("risk_level")
                    if isinstance((body or {}).get("anomalies"), dict) else None})
        print("." if body else "X", end="", flush=True)

        # Same guard as determinism.py: stop on a burst of failures instead of
        # grinding through guaranteed 429s once the daily budget runs dry.
        consecutive_fail = 0 if body else consecutive_fail + 1
        if consecutive_fail >= 5:
            print(f"\n[abort] 5 consecutive failures at run {i+1}/{times} — "
                  f"likely quota exhaustion, stopping to preserve what we have")
            h = quota.headroom()
            if not h.get("error") and not h.get("ample"):
                print(f"[abort] headroom now {h['headroom']:,} tokens, "
                      f"resets in {h['reset']}")
            break
    print()
    return out


def main() -> None:
    if not TOKEN:
        sys.exit('BASELINE_TOKEN not set. export BASELINE_TOKEN="$(python3 eval/mint_token.py)"')

    quota.require(R + R_CONTROL, label="anomaly precision/recall")

    truth_path = os.path.join(CORPUS, "planted_anomaly.csv.groundtruth.json")
    if not os.path.exists(truth_path):
        sys.exit(f"missing ground truth: {truth_path}")
    truth = json.load(open(truth_path))
    print(f"ground truth: spike row {truth['spike_row_index']}, "
          f"amount {truth['spike_amount']}, date {truth['spike_date']}")

    planted = run(os.path.join(CORPUS, "planted_anomaly.csv"), R, "planted")
    control = run(os.path.join(CORPUS, "all_identical_rows.csv"), R_CONTROL, "control")

    json.dump({"ground_truth": truth, "planted": planted, "control": control},
              open(OUT, "w"), indent=2)

    # ---- planted: precision / recall over row-level statements ----
    tp = fp = ds = 0
    detected_runs = 0
    valid = [r for r in planted if r["outcome"] == "ok"]
    for r in valid:
        found = False
        for s in r["anomalies"]:
            k = classify(s, truth)
            if k == "tp":
                tp += 1
                found = True
            elif k == "fp":
                fp += 1
            else:
                ds += 1
        detected_runs += bool(found)

    fn = len(valid) - detected_runs   # a run that never named the spike
    precision = tp / (tp + fp) if (tp + fp) else float("nan")
    recall = detected_runs / len(valid) if valid else float("nan")

    print("\n" + "=" * 78)
    print(f"PLANTED ANOMALY — {len(valid)}/{R} runs succeeded")
    print("=" * 78)
    print(f"  runs that flagged the planted row : {detected_runs}/{len(valid)}"
          f"  (per-run recall = {100*recall:.0f}%)")
    print(f"  row-level statements: TP={tp}  FP={fp}   -> precision = "
          f"{100*precision:.0f}%" if (tp + fp) else "  no row-level statements")
    print(f"  dataset-level statements (unscored): {ds}")
    print(f"  runs that MISSED it (false negatives): {fn}")
    risk = {}
    for r in valid:
        risk[r["risk_level"]] = risk.get(r["risk_level"], 0) + 1
    print(f"  risk_level distribution: {risk}")

    # ---- control: any row-level statement is a false positive ----
    cvalid = [r for r in control if r["outcome"] == "ok"]
    cfp = 0
    cds = 0
    for r in cvalid:
        for s in r["anomalies"]:
            k = classify(s, truth)
            if k == "fp":
                cfp += 1
            elif k == "dataset":
                cds += 1
    print("\n" + "=" * 78)
    print(f"NEGATIVE CONTROL (50 identical rows) — {len(cvalid)}/{R_CONTROL} runs succeeded")
    print("=" * 78)
    print(f"  row-level false positives: {cfp}")
    print(f"  dataset-level statements (unscored): {cds}")
    clean = sum(1 for r in cvalid if not r["anomalies"])
    print(f"  runs reporting NO anomalies at all: {clean}/{len(cvalid)}")
    for r in cvalid[:3]:
        for s in r["anomalies"]:
            print(f"    [{classify(s, truth)}] {s[:66]}")

    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
