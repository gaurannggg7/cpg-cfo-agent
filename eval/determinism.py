#!/usr/bin/env python3
"""
determinism.py — run ONE clean input N times and measure run-to-run variance.

Answers three questions for the "deterministic reasoning pipeline" claim:
  1. categorization agreement — how often does total_by_category repeat?
  2. anomaly-set stability    — is the same anomaly set returned every run?
  3. summary totals match     — do the numeric outputs agree run to run?

metrics.total_spend is computed in code by pandas (main.py), not by the LLM, so
it doubles as a control: if it varies, something other than sampling is wrong.

Latency percentiles are computed from the same runs — every run is a full
end-to-end request at production settings, which is exactly what a latency
sample needs. N=50 therefore also satisfies an N>=30 latency requirement.

Config from env (never hardcoded):
    BASELINE_API_URL, BASELINE_TOKEN, BASELINE_TIMEOUT, BASELINE_REVENUE
    DETERMINISM_N   default 50
    DETERMINISM_FILE  default eval/fixtures/clean_reference.csv

    export BASELINE_TOKEN="$(python3 eval/mint_token.py)"
    python3 eval/determinism.py
"""
import json
import os
import statistics
import sys
from collections import Counter

from run_corpus import post_file, TOKEN
import quota

HERE = os.path.dirname(os.path.abspath(__file__))
N = int(os.environ.get("DETERMINISM_N", "50"))
INPUT = os.environ.get("DETERMINISM_FILE",
                       os.path.join(HERE, "fixtures", "clean_reference.csv"))
OUT = os.path.join(HERE, "determinism_runs.json")


def canon(obj) -> str:
    """Stable string form for equality comparison."""
    return json.dumps(obj, sort_keys=True, default=str)


def agreement(values: list) -> tuple:
    """(modal_share_pct, distinct_count, modal_value)."""
    counts = Counter(canon(v) for v in values)
    top, freq = counts.most_common(1)[0]
    return 100.0 * freq / len(values), len(counts), top


def main() -> None:
    if not TOKEN:
        sys.exit('BASELINE_TOKEN not set. export BASELINE_TOKEN="$(python3 eval/mint_token.py)"')
    if not os.path.exists(INPUT):
        sys.exit(f"missing input: {INPUT}")

    # Pre-flight: refuse to start a run that cannot fit in the token budget.
    # Without this the harness produces rate-limited 500s that look like
    # pipeline failures but are just an exhausted quota.
    quota.require(N, label="determinism")

    print(f"\ndeterminism: {os.path.basename(INPUT)} x {N}\n")
    runs = []
    consecutive_fail = 0
    for i in range(1, N + 1):
        res = post_file(INPUT)
        ok = res["outcome"] == "ok" and isinstance(res.get("body"), dict)
        body = res["body"] if ok else None
        runs.append({"i": i, "outcome": res["outcome"],
                     "latency_s": round(res["latency"], 3), "body": body})
        mark = "." if ok else "X"
        print(mark, end="", flush=True)
        if i % 25 == 0:
            print(f"  {i}/{N}")

        # Bail out early rather than grinding through dozens of 429s: a burst
        # of instant failures means the budget ran out mid-run.
        consecutive_fail = 0 if ok else consecutive_fail + 1
        if consecutive_fail >= 5:
            print(f"\n[abort] 5 consecutive failures at run {i}/{N} — "
                  f"likely quota exhaustion, stopping to preserve what we have")
            h = quota.headroom()
            if not h.get("error") and not h.get("ample"):
                print(f"[abort] headroom now {h['headroom']:,} tokens, "
                      f"resets in {h['reset']}")
            break
    print()

    with open(OUT, "w") as f:
        json.dump(runs, f, indent=2, default=str)

    good = [r for r in runs if r["body"]]
    failed = len(runs) - len(good)
    print(f"\nsuccessful runs: {len(good)}/{N}   failed: {failed}")
    if not good:
        sys.exit("no successful runs — cannot measure determinism")

    def field(path):
        out = []
        for r in good:
            cur = r["body"]
            for k in path:
                cur = (cur or {}).get(k) if isinstance(cur, dict) else None
            out.append(cur)
        return out

    print("\n" + "=" * 78)
    print("DETERMINISM (share of runs returning the MODAL value; 100% = deterministic)")
    print("=" * 78)

    checks = [
        ("metrics.total_spend  [pandas, control]", ["metrics", "total_spend"]),
        ("metrics.total_transactions [control]", ["metrics", "total_transactions"]),
        ("categories.total_by_category [LLM]", ["categories", "total_by_category"]),
        ("anomalies.anomalies [LLM]", ["anomalies", "anomalies"]),
        ("anomalies.risk_level [LLM]", ["anomalies", "risk_level"]),
        ("runway.runway_months [LLM]", ["runway", "runway_months"]),
        ("summary text [LLM]", ["summary"]),
    ]
    for label, path in checks:
        vals = field(path)
        pct, distinct, modal = agreement(vals)
        show = modal if len(modal) <= 42 else modal[:39] + "..."
        print(f"{label:40s} {pct:5.1f}%  distinct={distinct:<3d} modal={show}")

    # ---- numeric spread on the LLM-produced runway ----
    rw = [v for v in field(["runway", "runway_months"]) if isinstance(v, (int, float))]
    if rw:
        print(f"\nrunway_months across runs: min={min(rw)}  max={max(rw)}  "
              f"distinct={len(set(rw))}")
        if len(set(rw)) > 1:
            print(f"  mean={statistics.mean(rw):.2f}  stdev={statistics.pstdev(rw):.2f}")

    # ---- anomaly set stability (Jaccard vs the modal set) ----
    sets = [frozenset(v) for v in field(["anomalies", "anomalies"])
            if isinstance(v, list)]
    if sets:
        modal_set = Counter(sets).most_common(1)[0][0]
        jac = []
        for s in sets:
            union = len(s | modal_set)
            jac.append(len(s & modal_set) / union if union else 1.0)
        exact = sum(1 for s in sets if s == modal_set)
        print(f"\nanomaly set: exact-match {exact}/{len(sets)} "
              f"({100*exact/len(sets):.0f}%)  mean Jaccard vs modal={statistics.mean(jac):.2f}")
        allc = Counter(a for s in sets for a in s)
        print("  most common anomaly strings:")
        for txt, c in allc.most_common(5):
            print(f"    {c:3d}/{len(sets)}  {txt[:66]}")

    # ---- latency ----
    lat = sorted(r["latency_s"] for r in good)
    def pct_at(q):
        return lat[min(int(len(lat) * q / 100), len(lat) - 1)]
    print("\n" + "=" * 78)
    print(f"LATENCY over {len(lat)} successful runs (same input, production settings)")
    print("=" * 78)
    print(f"  p50={pct_at(50):.2f}s  p95={pct_at(95):.2f}s  p99={pct_at(99):.2f}s")
    print(f"  min={lat[0]:.2f}s  max={lat[-1]:.2f}s  mean={statistics.mean(lat):.2f}s")
    print(f"  under 3s: {sum(1 for x in lat if x < 3)}/{len(lat)}")
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
