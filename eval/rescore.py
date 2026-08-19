#!/usr/bin/env python3
"""
rescore.py — re-apply scoring to corpus/results.json without re-running the API.

Scoring logic (notably injection-obedience detection) evolves; the recorded
responses do not. This recomputes actual_result / pass from the saved bodies so
a scoring fix costs nothing in LLM quota.

    python3 eval/rescore.py
"""
import csv
import json
import os

from run_corpus import detect_obedience, verdict

HERE = os.path.dirname(os.path.abspath(__file__))
CORPUS = os.path.join(HERE, "corpus")
MANIFEST = os.path.join(CORPUS, "manifest.csv")
RESULTS = os.path.join(CORPUS, "results.json")


def main() -> None:
    results = json.load(open(RESULTS))
    with open(MANIFEST) as f:
        rows = list(csv.DictReader(f))

    changed = []
    for row in rows:
        name = row["file"]
        rec = results.get(name)
        if not rec:
            continue

        body = rec.get("body")
        outcome = rec["outcome"]
        signals = []

        # Reclassify upstream rate-limit 503s recorded before the 'quota'
        # bucket existed: they are provider unavailability, not pipeline
        # failures, and the input was never evaluated.
        if rec.get("status") == 503 and isinstance(body, dict):
            d = body.get("detail")
            if isinstance(d, dict) and d.get("error") == "upstream_rate_limited":
                outcome = "quota"

        # Re-derive from the raw transport outcome, undoing any prior "obeyed".
        if outcome in ("ok", "obeyed") and isinstance(body, dict):
            outcome = "ok"
            signals = detect_obedience(body, os.path.join(CORPUS, name))
            if signals and row["expected"] == "ignore":
                outcome = "obeyed"

        before = (row["actual_result"], row["pass"])
        row["actual_result"] = outcome
        row["pass"] = verdict(row["expected"], outcome, bool(signals))
        rec["outcome"] = outcome
        rec["obedience_signals"] = signals
        if before != (row["actual_result"], row["pass"]):
            changed.append((name, before, (row["actual_result"], row["pass"])))

    with open(MANIFEST, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    with open(RESULTS, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print(f"rescored {len(rows)} rows; {len(changed)} changed")
    for name, b, a in changed:
        print(f"  {name:34s} {b[0]}/{b[1]} -> {a[0]}/{a[1]}")

    groups = {}
    for r in rows:
        groups.setdefault(r["group"], []).append(r)
    print("\n" + "=" * 74)
    print(f"{'GROUP':<12}{'N':>4}{'PASS':>6}{'FAIL':>6}{'RATE':>8}   outcomes")
    print("-" * 74)
    for g in sorted(groups):
        rs = groups[g]
        p = sum(1 for r in rs if r["pass"] == "PASS")
        counts = {}
        for r in rs:
            counts[r["actual_result"]] = counts.get(r["actual_result"], 0) + 1
        blurb = " ".join(f"{k}={v}" for k, v in sorted(counts.items()))
        print(f"{g:<12}{len(rs):>4}{p:>6}{len(rs)-p:>6}{100*p/len(rs):>7.0f}%   {blurb}")
    tp = sum(1 for r in rows if r["pass"] == "PASS")
    print("-" * 74)
    print(f"{'TOTAL':<12}{len(rows):>4}{tp:>6}{len(rows)-tp:>6}{100*tp/len(rows):>7.0f}%")

    obeyed = [n for n, v in results.items() if v.get("obedience_signals")]
    print(f"\nprompt injections obeyed: {len(obeyed)}")
    for n in obeyed:
        print(f"   {n} -> {results[n]['obedience_signals']}")
    if not obeyed:
        print("   none — injected text treated as data")


if __name__ == "__main__":
    main()
