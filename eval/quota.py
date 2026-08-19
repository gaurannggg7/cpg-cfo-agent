#!/usr/bin/env python3
"""
quota.py — read Groq's remaining token headroom before spending it.

Why this exists: the eval harness burned a full day's free-tier allowance on a
50-run probe that could never have fit (50 x ~3,710 tokens vs a 100,000 TPD
ceiling), and 41 of those runs came back as unusable 500s. Every run script now
does a pre-flight budget check so it either fits, or refuses and says by how
much it missed.

A REJECTED request consumes no tokens, so probing with a deliberately oversized
max_tokens is a free way to read the current counter out of the 429 message.

Reads GROQ_API_KEY from the environment, or from backend/.env (gitignored).
Nothing is hardcoded and nothing is written to a tracked file.

    python3 eval/quota.py            # print headroom
"""
import os
import re
import subprocess
import sys

TOKENS_PER_RUN = int(os.environ.get("TOKENS_PER_RUN", "3710"))
CONTAINER = os.environ.get("BASELINE_CONTAINER", "cfgcfoagent-backend-1")

_PROBE = """
import os, re
from groq import Groq
c = Groq(api_key=os.environ['GROQ_API_KEY'])
try:
    c.chat.completions.create(model='llama-3.3-70b-versatile',
        messages=[{'role':'user','content':'hi'}], max_tokens=8000)
    print('HEADROOM_GT_8000')
except Exception as e:
    s = str(e)
    u = re.search(r'Used (\\d+)', s); l = re.search(r'Limit (\\d+)', s)
    t = re.search(r'try again in ([^\\.\"]+)', s)
    if u and l:
        print(f'USED={u.group(1)} LIMIT={l.group(1)} RESET={t.group(1) if t else "?"}')
    else:
        print('PROBE_ERR ' + s[:200])
"""


def headroom() -> dict:
    """
    Return {'used', 'limit', 'headroom', 'runs_affordable', 'reset'}.

    Probes through the backend container so the request uses the same
    credentials and network path as the pipeline itself.
    """
    try:
        out = subprocess.run(
            ["docker", "exec", CONTAINER, "python", "-c", _PROBE],
            capture_output=True, text=True, timeout=60,
        ).stdout
    except Exception as exc:  # noqa: BLE001
        return {"error": f"probe failed: {exc}"}

    if "HEADROOM_GT_8000" in out:
        # Enough for at least a couple of runs; exact figure unknown but ample.
        return {"used": None, "limit": None, "headroom": None,
                "runs_affordable": None, "reset": None, "ample": True}

    m = re.search(r"USED=(\d+) LIMIT=(\d+) RESET=(.*)", out)
    if not m:
        return {"error": out.strip()[:300] or "no probe output"}

    used, limit = int(m.group(1)), int(m.group(2))
    free = max(limit - used, 0)
    return {"used": used, "limit": limit, "headroom": free,
            "runs_affordable": free // TOKENS_PER_RUN,
            "reset": m.group(3).strip(), "ample": False}


def require(n_runs: int, label: str = "") -> dict:
    """
    Pre-flight gate. Exits non-zero if n_runs cannot be afforded.

    Returns the headroom dict when there is enough budget.
    """
    h = headroom()
    if h.get("error"):
        print(f"[quota] could not read budget: {h['error']}")
        print("[quota] proceeding blind — abort with Ctrl-C if that is not intended")
        return h

    need = n_runs * TOKENS_PER_RUN
    if h.get("ample"):
        print(f"[quota] headroom ample (>8000); need ~{need:,} for {n_runs} runs")
        return h

    print(f"[quota] limit={h['limit']:,}  used={h['used']:,}  "
          f"headroom={h['headroom']:,} tokens")
    print(f"[quota] {label or 'run'} needs ~{need:,} tokens for {n_runs} runs "
          f"(~{TOKENS_PER_RUN:,}/run)")
    print(f"[quota] affordable now: {h['runs_affordable']} runs   "
          f"window resets in {h['reset']}")

    if h["runs_affordable"] < n_runs:
        short = need - h["headroom"]
        sys.exit(
            f"\n[quota] REFUSING TO START: short by ~{short:,} tokens.\n"
            f"        Either wait for the rolling window ({h['reset']}), "
            f"lower N to {h['runs_affordable']}, or upgrade the tier.\n"
            f"        Starting anyway would produce rate-limited 500s, not data."
        )
    return h


if __name__ == "__main__":
    h = headroom()
    if h.get("error"):
        sys.exit(f"error: {h['error']}")
    if h.get("ample"):
        print("headroom: ample (>8000 tokens)")
    else:
        print(f"limit={h['limit']:,}  used={h['used']:,}  headroom={h['headroom']:,}")
        print(f"full runs affordable (~{TOKENS_PER_RUN:,}/run): {h['runs_affordable']}")
        print(f"window resets in: {h['reset']}")
