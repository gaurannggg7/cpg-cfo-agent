# Model migration: llama-3.3-70b-versatile → openai/gpt-oss-120b

Groq deprecated `llama-3.3-70b-versatile` 2026-06-17, shutdown 2026-08-16.
`openai/gpt-oss-120b` is Groq's official migration target. This documents what
was checked before switching, and what a single post-migration smoke test
found. It is not a re-run of `eval/RESULTS.md`'s methodology — see that file's
§0 for which findings do and don't survive this migration untouched.

## Compatibility checked before switching

Tested directly against the Groq API, isolated from `agent.py`, before touching
any code:

- `response_format={"type": "json_object"}` — **accepted**, no error.
- `seed=42` — **accepted**, no error.
- `temperature=0` — accepted (standard OpenAI-compatible param, not
  model-specific).

**One thing that looked like an incompatibility and wasn't:** an initial test
with `max_tokens=100` failed with `json_validate_failed` and an empty
`failed_generation`. Root cause: `gpt-oss-120b` is a reasoning model — it
spends real completion tokens on hidden chain-of-thought before emitting
output (`reasoning_tokens=133` of `completion_tokens=154` on a trivial
prompt), so a low cap truncates it mid-reasoning before any JSON is ever
produced. Retesting with `max_tokens=500` succeeded cleanly. **Not a real
issue for this codebase** — none of `agent.py`'s four `.create()` calls set an
explicit `max_tokens`, so this failure mode doesn't apply to them. Flagged
here because it cost real debugging time and would bite anyone who adds a cap
later without knowing why.

**Cost implication worth carrying forward:** reasoning tokens count against
`completion_tokens` in the API response and presumably against Groq's TPD
quota the same as visible output tokens. `eval/RESULTS.md`'s
~3,700 tokens/run budget was measured entirely against the old model; the new
model's real per-run cost has not been measured and is likely higher.

## Live smoke test — one real `/analyze` call

Real request through the full pipeline (auth, parse, parallel fan-out,
summarize), using the production sample data
(`eval/fixtures/clean_reference.csv`, 51 rows).

**Result: 200 OK, 9.7s, correct top-level shape.** `summary`, `categories`,
`anomalies`, `runway`, `metrics` all present as expected.

**Fix 6's pinned category-item schema holds exactly:**
```json
{"date": "2026-01-02", "amount": -3017.44, "description": "Raw Materials - Packaging Corp"}
```
Matches the prompt's pinned `{date, amount, description}` shape with no extra
keys — the same defect fix 6 was built to prevent (four different item shapes
observed across llama-3.3 runs) has not resurfaced.

**`total_by_category` reconciles exactly**, as expected — this is computed in
pandas (fix 5), untouched by which model is behind the API.

## 1. Markdown syntax in the free-text summary — FIXED, verified 5/5

The `summarize` node's output initially contained `**bold**` markdown despite
the prompt never requesting it. `Dashboard.tsx` renders `summary` as plain
text (`whitespace-pre-wrap`, no markdown parser) — the literal `**`
characters would have shown up in the UI.

**Fix: prompt instruction, not server-side stripping.** Added to
`generate_cfo_summary`'s prompt: *"Output plain text only: no markdown syntax
of any kind - no asterisks, no bold/italic markers, no headers, no bullet or
numbered list characters, no code fences."*

**Verified across 5 fresh runs** (`re.findall(r'\*\*|^#|^-\s|^\d+\.\s|` ``` `,
summary)`): **0 markdown hits in all 5.** The prompt fix holds; no
server-side fallback needed.

## 2. Incomplete categorize output — intermittent, not a fixed 6/51, not fixed

Re-ran `categorize_transactions` through the real pipeline 5 times (spaced 70s
apart to clear TPM — see §3), using the real 51-row production sample, no
prompt changes:

| Run | Assigned / 51 |
|---|---|
| 1 | 51 |
| 2 | 51 |
| 3 | 50 |
| 4 | 41 |
| 5 | 51 |

Plus 2 earlier runs before the TPM issue was understood (same input, same
code): 38/51 and 51/51. And the original single smoke test that triggered
this investigation: **6/51.**

**Conclusion: this is real and repeatable, but the original 6/51 was a severe
outlier, not the steady state.** Across 8 total observations: 3 were fully
complete (51/51), 5 were incomplete, ranging 38–50/51 — except the one
striking exception at 6/51 that hasn't recurred in 7 subsequent runs. At
`temperature=0, seed=42` this is real instruction-following variance on "assign
**each** transaction," not sampling noise in the traditional sense (the
pandas-computed control fields are 100% stable per `RESULTS.md` §2) — it's the
model choosing to stop enumerating partway through a subset of runs.

**Still does not affect the product** — confirmed again, unchanged from the
first note: `SpendByCategoryChart.tsx` reads only `categories.total_by_category`
(pandas-computed, fix 5), never the LLM's nested per-transaction lists.

**Not fixed, per instruction — reported for a priority decision.** If pursued,
the fix is almost certainly prompt-side (e.g. asking the model to enumerate a
count or hold the list is the exact task, not requesting the whole
transformation in the same completion as a large reasoning budget).

### This bears directly on RESULTS.md's 70% anomaly recall figure

**That number should not be assumed to hold against this model.**
`detect_anomalies` is a smaller/simpler version of the same task class as
`categorize_transactions` — both require the model to read every row of the
input and account for all of it, not summarize a sample. This section just
measured that `categorize_transactions` fails to do that in 5/8 runs (some
severely). Recall for the planted-anomaly detector specifically depends on the
model actually seeing and considering the one spike row among 50 — if the same
incomplete-enumeration behavior applies there, recall could be worse than 70%,
not because detection logic changed, but because the model may not process
the row at all on some runs. This needs its own re-measurement, not an
assumption either way — flagging the mechanism, not asserting the number.

## 3. Token cost per run, including reasoning tokens — measured, not estimated

5 real pipeline runs (real sample data, spaced 70s apart), capturing full
Groq `usage` (including `completion_tokens_details.reasoning_tokens`) by
wrapping the actual metrics hook `agent.py` already calls — same code path as
production, no prompts re-implemented separately.

| | Total tokens/run | Reasoning tokens/run | % reasoning |
|---|---|---|---|
| Mean | **8,536** | 3,279 | 38% |
| Min | 8,141 | 2,738 | — |
| Max | 8,969 | 3,661 | — |

Per node:

| Node | Mean total | Mean reasoning | % reasoning |
|---|---|---|---|
| `categorize` | 4,139 | 1,697 | 41% |
| `summarize` | 3,727 | 1,379 | 37% |
| `detect_anomalies` | 670 | 203 | 30% |
| `runway_calc` | 0 | — | pure Python, unchanged |

**`RESULTS.md`'s ~3,700–5,300 tokens/run figure is superseded — the real
number is ~2x higher, at ~8,500/run.** Reasoning tokens are not a rounding
error; they're over a third of every call.

### New, more severe finding: TPM, not just TPD, is now a binding constraint

Discovered incidentally while spacing these runs — `openai/gpt-oss-120b`'s
rate-limit headers (confirmed via a live request):

```
x-ratelimit-limit-tokens = 8000       (per minute)
```

The old model's TPM was 12,000 (confirmed earlier this session). **A single
full analysis now costs ~8,536 tokens — essentially the entire per-minute
budget in one request.** The three parallel fan-out calls alone
(`categorize` + `detect_anomalies`, `runway_calc` costs nothing) fire ~4,800
tokens simultaneously at request start.

This sharpens `RESULTS.md` §3's TPM/parallelism finding considerably: that
finding was "concurrent load can trip TPM." The current finding is **a single
solo user clicking "Analyze" once can plausibly trip TPM on its own**, before
any concurrency is involved. This deserves attention independent of anything
else in this document — quota planning should treat ~8,500 tokens/run as the
number, and TPM (not just the daily cap) as a hard per-request constraint, not
just a burst-load concern.

**Daily (TPD) quota was not re-measured for this model** — only TPM was
observed, incidentally. If daily-budget planning is needed, that still needs
its own check.

## Not done here

- No re-run of `eval/RESULTS.md`'s determinism or latency methodology against
  the new model — explicitly out of scope for this pass.
- No re-run of precision/recall — flagged above as likely affected, not
  measured.
- TPD (daily) quota for the new model not measured, only TPM.
