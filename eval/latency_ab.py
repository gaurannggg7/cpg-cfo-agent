#!/usr/bin/env python3
"""
latency_ab.py — sequential vs parallel graph topology, measured head to head.

Runs INSIDE the backend container (it imports agent directly) so the number
being compared is pipeline wall-clock, not HTTP + auth overhead. That is the
quantity the "reduced inference latency" claim is about.

Method notes that matter for the result being trustworthy:

  * The two arms are INTERLEAVED run-by-run (seq, par, seq, par, ...), not run
    as block A then block B. Groq latency drifts with load and with how close
    the account is to its quota ceiling; measuring one arm entirely before the
    other would let that drift masquerade as a topology effect.
  * Both arms issue exactly the same three LLM calls (categorize,
    detect_anomalies, summarize). runway_calc is pure arithmetic in both, so
    token cost per run is identical and only the ordering differs.
  * A run that fails (quota) is recorded and excluded from both arms' stats
    rather than counted as zero.

    docker cp eval/latency_ab.py <container>:/tmp/ && \
    docker exec <container> python /tmp/latency_ab.py 6
"""
import importlib
import json
import os
import statistics
import sys
import time
from io import StringIO

import pandas as pd

# The pipeline modules live in the container's app dir; this script is copied
# into /tmp, so that dir has to be on sys.path explicitly.
sys.path.insert(0, os.environ.get("BASELINE_APP_DIR", "/app"))

FIXTURE = "/tmp/clean_reference.csv"


def build_state():
    raw = open(FIXTURE, "rb").read()
    df = pd.read_csv(StringIO(raw.decode("utf-8-sig")))
    df["date"] = pd.to_datetime(df["date"], errors="coerce", format="mixed")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["date", "amount"]).sort_values("date")
    months = len(df.groupby(df["date"].dt.to_period("M"))) or 1
    monthly_burn = float(df["amount"].sum() / months)
    return {
        "csv_text": df.to_csv(index=False),
        "df_summary": df.describe().to_string(),
        "monthly_burn": monthly_burn,
        "monthly_spend": abs(monthly_burn),
        "monthly_revenue": 100000.0,
        "cash_on_hand": None,
        "categorized": {}, "anomalies": {}, "runway": {}, "summary": "",
    }


def load_agent(sequential: bool):
    os.environ["BASELINE_SEQUENTIAL"] = "1" if sequential else "0"
    import agent
    importlib.reload(agent)
    return agent


def timed(agent_mod, state):
    t0 = time.time()
    try:
        agent_mod.cfo_app.invoke(dict(state))
        return {"ok": True, "seconds": time.time() - t0}
    except Exception as exc:
        return {"ok": False, "seconds": time.time() - t0,
                "error": type(exc).__name__, "detail": str(exc)[:160]}


def pct(vals, q):
    s = sorted(vals)
    return s[min(int(len(s) * q / 100), len(s) - 1)]


def summarize(name, vals):
    if not vals:
        print(f"{name:12s} no successful runs")
        return None
    print(f"{name:12s} n={len(vals):2d}  p50={pct(vals,50):6.2f}s  "
          f"p95={pct(vals,95):6.2f}s  p99={pct(vals,99):6.2f}s  "
          f"min={min(vals):6.2f}s  max={max(vals):6.2f}s  "
          f"mean={statistics.mean(vals):6.2f}s")
    return {"n": len(vals), "p50": pct(vals, 50), "p95": pct(vals, 95),
            "p99": pct(vals, 99), "min": min(vals), "max": max(vals),
            "mean": statistics.mean(vals)}


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    state = build_state()
    seq_agent = load_agent(True)
    print(f"sequential mode loaded: {seq_agent._SEQUENTIAL}")
    par_agent = load_agent(False)
    print(f"parallel mode loaded:   {not par_agent._SEQUENTIAL}\n")

    records = []
    seq, par = [], []
    for i in range(1, n + 1):
        # Interleaved, and the leading arm alternates each iteration so neither
        # arm systematically occupies the "first call after idle" slot.
        order = [("sequential", True), ("parallel", False)]
        if i % 2 == 0:
            order.reverse()
        for label, is_seq in order:
            mod = load_agent(is_seq)
            r = timed(mod, state)
            r.update({"arm": label, "iteration": i})
            records.append(r)
            if r["ok"]:
                (seq if is_seq else par).append(r["seconds"])
            print(f"  [{i}/{n}] {label:10s} "
                  f"{'ok ' if r['ok'] else r.get('error','ERR')} "
                  f"{r['seconds']:6.2f}s", flush=True)

    print()
    s_stats = summarize("sequential", seq)
    p_stats = summarize("parallel", par)

    if s_stats and p_stats:
        d50 = s_stats["p50"] - p_stats["p50"]
        pctchg = 100 * d50 / s_stats["p50"] if s_stats["p50"] else 0
        print(f"\np50 delta: {d50:+.2f}s  ({pctchg:+.1f}% vs sequential)")
        print(f"mean delta: {s_stats['mean'] - p_stats['mean']:+.2f}s")

    failed = [r for r in records if not r["ok"]]
    if failed:
        print(f"\nfailed runs (excluded): {len(failed)}")
        for r in failed[:6]:
            print(f"   {r['arm']:10s} {r.get('error')}: {r.get('detail','')[:90]}")

    json.dump({"sequential": s_stats, "parallel": p_stats, "records": records},
              open("/tmp/latency_ab.json", "w"), indent=2)
    print("\nwrote /tmp/latency_ab.json")


if __name__ == "__main__":
    main()
