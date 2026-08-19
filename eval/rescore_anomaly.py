#!/usr/bin/env python3
"""
rescore_anomaly.py — re-score saved anomaly runs under both scoring rules.

Reads eval/anomaly_runs.json (already-collected responses) and reports
precision/recall under the lenient rule (headline) and the strict rule
(sensitivity check), so the effect of the row-level/dataset-level judgement
call is explicit rather than hidden. Costs no LLM tokens.

    python3 eval/rescore_anomaly.py
"""
import json
import os

from anomaly_score import classify

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = os.path.join(HERE, "anomaly_runs.json")


def score(planted, truth, strict):
    tp = fp = ds = 0
    detected = 0
    valid = [r for r in planted if r["outcome"] == "ok"]
    for r in valid:
        found = False
        for s in r["anomalies"]:
            k = classify(s, truth, strict=strict)
            if k == "tp":
                tp += 1
                found = True
            elif k == "fp":
                fp += 1
            else:
                ds += 1
        detected += bool(found)
    precision = tp / (tp + fp) if (tp + fp) else float("nan")
    recall = detected / len(valid) if valid else float("nan")
    return {"tp": tp, "fp": fp, "dataset": ds, "detected": detected,
            "n": len(valid), "precision": precision, "recall": recall}


def main() -> None:
    d = json.load(open(RUNS))
    truth = d["ground_truth"]

    print(f"ground truth: row {truth['spike_row_index']}, "
          f"amount {truth['spike_amount']}, date {truth['spike_date']}\n")

    for strict in (False, True):
        label = "STRICT (sensitivity)" if strict else "LENIENT (headline)"
        s = score(d["planted"], truth, strict)
        print("=" * 70)
        print(f"{label} — planted_anomaly.csv, n={s['n']}")
        print("=" * 70)
        print(f"  recall    : {s['detected']}/{s['n']} runs flagged the spike "
              f"= {100*s['recall']:.0f}%")
        print(f"  precision : TP={s['tp']} FP={s['fp']} "
              f"= {100*s['precision']:.0f}%")
        print(f"  dataset-level statements (unscored): {s['dataset']}")

        c = score(d["control"], truth, strict)
        print(f"  control (50 identical rows), n={c['n']}: "
              f"row-level false positives = {c['fp']}, "
              f"dataset-level = {c['dataset']}")
        print()


if __name__ == "__main__":
    main()
