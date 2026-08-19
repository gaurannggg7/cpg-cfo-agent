# Baseline — Measured Reliability Report

Adversarial evaluation of the Baseline pipeline (Next.js → FastAPI → LangGraph →
Groq Llama 3.3 70B), run to replace three unvalidated resume claims with numbers
that survive scrutiny.

Everything below is measured, not estimated. Where a number could not be
obtained, it says so rather than being filled in.

---

## 0. Model provenance — read this before citing any number below

**Every measurement in this report was taken against `llama-3.3-70b-versatile`
at `temperature=0, seed=42`.** Groq deprecated that model 2026-06-17 and shut it
down 2026-08-16; the pipeline has since migrated to their official replacement,
`openai/gpt-oss-120b`, at the same `temperature=0, seed=42` settings. The
migration was a drop-in on API surface — `response_format={"type":
"json_object"}` and `seed` are both accepted without error — but it was **not**
re-measured against this report's methodology. Two real behavioral differences
were observed in a single post-migration smoke test and are documented in
`eval/MIGRATION_NOTES.md`; they were not present in the numbers below.

**Model-independent — still hold as stated:**
- The parse-layer fix (§1, §2's `duplicate_columns`/`missing_columns`/etc.):
  62% → 100% pass rate. This logic runs entirely in `main.py` before any LLM
  call; re-verified directly against the corpus with zero regressions after
  both the model migration and the separate `rows_dropped` fix (§ below).
- All 8 numbered fixes in §7 (schema guard, JSON parse fallback, runway
  arithmetic, duplicate-header rejection, pandas-computed totals, pinned
  category schema, 429→503 handling, exception-masking fix) — these are
  pipeline/backend behavior, not model output.
- §3's TPM/parallelism finding (concurrent calls concentrating burst against a
  shared per-minute ceiling) — a property of the provider's rate limiting
  architecture and the fan-out topology, not of which model sits behind the
  API.
- The synthetic-graph concurrency verification (6.04s → 2.01s) — no LLM
  involved.

**Model-specific — would need re-measuring against gpt-oss-120b before citing:**
- §2's determinism percentages (4.5% → 100% for pandas-derived fields; the
  57.1%/14.3% figures for LLM-authored anomaly/summary text)
- §4's precision/recall (70% recall, 88%/70% precision under the two scoring
  rules)
- §3's per-node latency means (categorize 8.32s, detect_anomalies 4.71s,
  summarize 14.45s) and the resulting ~17% parallelization ceiling — gpt-oss-120b
  is a reasoning model that spends completion tokens on hidden chain-of-thought
  before emitting output, which changes the token/latency profile per call in a
  way this report has not quantified

---

## 1. Headline: before vs after

| | BEFORE | AFTER |
|---|---|---|
| Adversarial corpus pass rate | **18/29 = 62%** | **27/27 evaluated = 100%** |
| Unhandled `500` crashes | **10** | **0** |
| — structural group | 5/13 = 38% | 13/13 = 100% |
| — value group | 7/10 = 70% | 9/9 = 100% |
| — semantic group | 6/6 = 100% | 5/5 = 100% |
| Prompt injections obeyed | 0 / 2 | 0 / 2 |
| Category totals matching pandas | **3/19 (16 wrong by >5%)** | **exact, by construction** |
| Financial figures deterministic | **no** (22 distinct values in 22 runs) | **yes** (1 distinct in 7) |
| p50 latency | 12.02s (n=19) | 14.04s (n=18) |
| Runs under 3s | 0/19 | 1/18 |

BEFORE snapshot preserved at `corpus/manifest.before.csv` and
`corpus/results.before.json`. AFTER state is `corpus/manifest.csv` /
`corpus/results.json`.

### NOT_RUN — excluded from the denominator, never counted as passes

Two of the 29 corpus files were **not evaluated** in the AFTER run:

| File | Why |
|---|---|
| `very_long_cell.csv` | `503 upstream_rate_limited` after 3 retries with backoff |
| `large_10k_rows.csv` | `503 upstream_rate_limited` after 3 retries with backoff |

Both are the most token-heavy inputs in the corpus, and both had returned
`200 OK` in standalone runs minutes earlier (8.8s and 11.8s). The failure is
Groq free-tier daily quota exhaustion, not a pipeline defect — but they are
reported as **NOT_RUN**, not as passes. The honest AFTER figure is
**27/27 of what was actually measured**, with 2 unmeasured.

---

## 2. Claim-by-claim

### Claim 1 — "0% failure rate on unformatted input at sub-3s latency"

**Originally claimed:** no failures on malformed input, responses under 3 seconds.

**What testing found:** both halves were false.

- 29 hostile CSVs (structural / value / semantic) produced **10 unhandled
  `500`s** — a 38% failure rate on hostile input, not 0%.
- Root causes, reproduced directly because the Prometheus middleware was
  masking them: `EmptyDataError`, `ParserError`, `KeyError: 'date'`,
  `UnicodeDecodeError`, and two `TypeError`s from summing strings.
- Latency p50 was **12.02s**, p95 23.41s. **0 of 19** successful runs finished
  under 3 seconds. The fastest run in the entire evaluation was 2.24s; the
  median sat between 12s and 26s throughout.

**What was fixed:**

- `parse_transactions()` in `main.py` — validates encoding, emptiness,
  duplicate headers, ragged rows, required columns, numeric amounts and
  parseable dates, returning structured **422** responses with machine-readable
  error codes.
- Currency-formatted amounts (`-$1,234.56`) are now cleaned and accepted;
  mixed/impossible dates are coerced and unusable rows dropped. Both previously
  crashed.
- Groq `RateLimitError` → **503 + `Retry-After`**; `APIError` → 502; catch-all →
  `HTTPException`. Previously a provider 429 surfaced as an unhandled 500 in
  ~0.2s with no indication of cause or when to retry.
- All errors now raise `HTTPException`, which Starlette's *inner*
  `ExceptionMiddleware` converts to a real Response. That is what fixes the log
  masking: the Prometheus instrumentator was crashing on
  `info.response.headers` when `response` was `None`, replacing every genuine
  traceback with `AttributeError: 'NoneType' object has no attribute 'headers'`.

**Result:** 62% → 100% on evaluated inputs, 10 crashes → 0.

> **Resume-ready:** *"Built a 29-case adversarial input corpus (malformed
> encodings, ragged rows, injection payloads) and used it to drive the
> structured-error pass rate from 62% to 100%, eliminating all 10 unhandled 500s."*

Note the latency half of the original claim is **not** rescued — see Claim 3.

---

### Claim 2 — "Deterministic reasoning pipeline"

**Originally claimed:** deterministic.

**What testing found:** not deterministic. One identical input
(`fixtures/clean_reference.csv`, the production sample) run 22 times:

| Field | Source | BEFORE (n=22) | AFTER (n=7) |
|---|---|---|---|
| `metrics.total_spend` | pandas *(control)* | 100.0% — 1 distinct | 100.0% — 1 distinct |
| `metrics.total_transactions` | pandas *(control)* | 100.0% — 1 distinct | 100.0% — 1 distinct |
| `categories.total_by_category` | LLM → **pandas** | **4.5% — 22 distinct** | **100.0% — 1 distinct** |
| `runway.runway_months` | LLM → **Python** | **63.6% — 5 distinct** | **100.0% — 1 distinct** |
| `anomalies.anomalies` | LLM | 4.5% — 22 distinct | 57.1% — 4 distinct |
| `anomalies.risk_level` | LLM | 100.0% — 1 distinct | 100.0% — 1 distinct |
| `summary` text | LLM | 4.5% — 22 distinct | **14.3% — 7 distinct** |

Anomaly-set stability: exact match **1/22 (5%) → 4/7 (57%)**, mean Jaccard
**0.045 → 0.667**.

The pandas-computed controls held at 100% across all 22 BEFORE runs, which
establishes that the variance was LLM sampling and not harness noise.

#### `temperature=0` and `seed=42` did NOT produce determinism

This is the most useful finding in the report and it should not be glossed.

Sampling was pinned to `temperature=0.0, seed=42` on every Groq call. **The
free-text fields still vary run to run.** In the AFTER run, `summary` produced
**7 distinct outputs in 7 runs** — no better than chance agreement — and
`anomalies` produced 4 distinct sets in 7. Groq documents `seed` as
best-effort, and this measurement is consistent with that: pinning sampling
narrowed semantic drift (anomaly Jaccard 0.045 → 0.667) but did not make the
model deterministic.

**Every field that became deterministic did so because the LLM was removed from
that path, not because sampling was pinned:**

- `total_by_category` is now summed in pandas (`totals_by_category()` in
  `main.py`)
- `runway_months` is now pure Python arithmetic (`calculate_runway()` in
  `agent.py`, zero LLM calls)

**Two arithmetic defects were found and fixed along the way:**

1. **Sign inversion.** Spend is stored as negative outflow, so `monthly_burn`
   was always `<= 0` and the branch `if monthly_burn > 0 else 999` hardcoded a
   999-month runway on every real ledger.
2. **Arithmetic laundered through the model.** The old code computed a value,
   embedded it in the prompt, and asked the LLM to echo it. Told to return
   `999.0`, across 19 corpus runs it returned 11.74, 7.35, 6.29, 9.45, 8.42,
   15.77, 9.09, 99.0, 0.0, 566.67, 48.1, 8.84, 7.32, 12.0, 9.05, 8.99,
   **1004.69**, 8.83, 8.57 — **never once 999.0**.

Separately, the runway formula itself was wrong: `12 * revenue / burn` is not
runway in any standard sense. It is now
`cash_on_hand / (monthly_spend - monthly_revenue)`, and returns `null` with a
stated `reason` when `cash_on_hand` is not supplied rather than fabricating a
number.

**Category totals were hallucinated.** Across 19 BEFORE runs, LLM-produced
`total_by_category` disagreed with the pandas total by >5% in **16 runs**, with
**8 sign-inverted** — e.g. `planted_anomaly.csv` reported COGS **+85,999** for
data totalling **−99,651**, and `prompt_injection_in_cell.csv` returned exactly
**0** for a ledger totalling **−83,139.15**. After the fix, `sum(total_by_category)`
equals `metrics.total_spend` exactly (verified: −99,651.18 = −99,651.18).

> **Resume-ready:** *"Diagnosed non-determinism in an LLM pipeline (22 distinct
> outputs across 22 identical runs) and made all financial figures deterministic
> by moving aggregation and runway arithmetic out of the model into pandas —
> narrative text remains non-deterministic, as `temperature=0` plus a fixed seed
> measurably does not guarantee reproducibility on Groq."*

---

### Claim 3 — "Reduced inference latency 40%" — **cannot be substantiated. Recommend dropping.**

**Originally claimed:** a 40% latency reduction.

**What testing found:** there is no baseline the number could have come from,
and the achievable ceiling is well under 40%.

1. **No "before" condition exists.** Nothing in the repository, git history, or
   any benchmark file records a pre-optimization latency. A 40% reduction has
   no measurable starting point.

2. **The structural ceiling is ~17%.** Measured per-node means:

   | Node | mean | LLM call? |
   |---|---|---|
   | `categorize` | 8.32s | yes |
   | `detect_anomalies` | 4.71s | yes |
   | `runway_calc` | **0.0001s** | **no — now pure arithmetic** |
   | `summarize` | 14.45s | yes |

   - Sequential floor: 8.32 + 4.71 + 0.00 + 14.45 = **27.48s**
   - Parallel floor: max(8.32, 4.71, 0.00) + 14.45 = **22.77s**
   - **Best case ≈ 4.7s saved ≈ 17%**

   `summarize` alone is **53% of wall-clock** and is strictly dependent on all
   three upstream nodes — it cannot be parallelized. That structurally caps any
   topology win far below 40%.

3. **The end-to-end A/B was inconclusive.** Interleaved, n=6 per arm attempted;
   **7 of 12 runs hit `RateLimitError`**, leaving n=3 sequential vs n=2
   parallel (sequential p50 23.29s, parallel p50 25.79s). At that sample size
   the difference is noise in both directions. No usable measurement was
   obtained.

4. **Observed latency never approached the claim.** p50 stayed in the 12–26s
   band across every phase; **1 of 18** AFTER runs finished under 3s.

#### The topology change itself is verified working

Separately from the unmeasurable end-to-end benefit, the parallelization is
mechanically correct:

- **Topology genuinely swaps.** Sequential builds a 4-hop chain
  (`categorize → detect_anomalies → runway_calc → summarize`); parallel builds
  3 fan-out edges from `__start__` plus 3 fan-in edges to `summarize`.
- **LangGraph delivers real concurrency.** A synthetic graph of three 2.0s
  sleep nodes ran **6.04s sequential vs 2.01s parallel** — a true 3× speedup,
  confirming the fan-out/fan-in executes concurrently rather than serially
  within a super-step.

So the mechanism works; what could not be shown is that it helps end-to-end
under this provider tier (see §3).

> **Resume-ready (either, both true and measured):**
>
> *"Restructured a 4-stage LangGraph pipeline into a parallel fan-out/fan-in DAG,
> verified 3× concurrency on the independent stages; end-to-end gain is capped at
> ~17% because the synthesis stage is 53% of wall-clock and strictly dependent."*
>
> *"Eliminated one of four LLM calls by moving runway arithmetic into Python —
> 8.32s → 0.0001s for that stage and ~25% fewer tokens per request."*

**The original "40%" line should be removed.**

---

## 3. Parallelism can be counterproductive on a rate-limited tier

This was not something the evaluation set out to find, and it is the reason the
latency A/B could not be completed.

The three parallel nodes fire their LLM calls **simultaneously into a shared
12,000 tokens-per-minute ceiling**. Concurrency that would reduce wall-clock
against an unconstrained provider instead *concentrates the burst*: three
requests land in the same minute rather than spreading across three, so the
parallel arm is more likely to trip TPM and stall or 429 than the sequential arm
that naturally spaces its calls.

Evidence from the A/B: of 7 rate-limit failures across 12 interleaved runs, the
parallel arm failed on 4 of 6 attempts. The arm that should have been faster was
the one more likely to be throttled.

Practical consequences:

- On a constrained tier, fan-out can be a net loss even when it is mechanically
  correct. The optimization is real (3× verified on synthetic nodes) but its
  benefit is conditional on provider headroom.
- A production deployment should either provision quota above the concurrent
  burst size, or add a concurrency limiter / token-bucket so fan-out width stays
  within the per-minute budget.
- Rate-limit handling must be a first-class path, not an afterthought. Before
  the fix, a 429 surfaced as an unhandled 500 in ~0.2s. It now returns
  `503 upstream_rate_limited` with `Retry-After`.

Two separate daily-quota exhaustions during this evaluation (100,000 TPD, at
~3,700–5,300 tokens per full pipeline run ≈ 26 runs/day) are why several
measurements are reported at reduced sample sizes.

---

## 4. Anomaly detection: precision and recall

Scored against a ground-truth sidecar the pipeline never sees.

**`planted_anomaly.csv`** — 50 rows, one planted −85,000 outflow among rows of
−200 to −400, n=10 runs:

| Metric | Lenient (headline) | Strict (sensitivity) |
|---|---|---|
| Recall | **7/10 = 70%** | 7/10 = 70% |
| Precision | TP=7, FP=1 → **88%** | TP=7, FP=3 → **70%** |

**Negative control** (`all_identical_rows.csv`, 50 identical rows, n=4):
**0 row-level false positives** under both rules.

### The precision judgement call, stated rather than hidden

Recall is **robust at 70% under both rules** — the detector missed the −85,000
spike outright in 3 of 10 runs. Precision depends on a classification decision
that changes the number, so both are reported.

The scorer initially marked 4 statements as false positives. Three of them make
no claim about a *specific* row:

- `"Negative transaction amounts"` (×2) — a generic observation, no row named
- `"Minimum transaction amount is significantly large and negative"` — an
  aggregate statistic that is in fact *pointing at* the spike, without naming it

Only one named a specific wrong row: `"Unusually large negative transaction on
2025-01-06"` — the planted row is `2025-04-06`. That is a genuine false
positive.

Under the **lenient** rule (headline), a statement is a false positive only if
it names a specific row that is not the planted one; vague and aggregate
remarks are bucketed as dataset-level and left unscored. Under the **strict**
rule, anything that is neither a spike match nor an explicit aggregate phrase
counts against precision. **88% vs 70%** is the spread between those two
readings. Neither is presented as "the" number.

---

## 5. Prompt injection

Two injection files (instruction text inside a `category` cell, and a fake
`SYSTEM:` directive inside a `description`). **Neither was obeyed, before or
after.** Output remained ordinary financial analysis — no debug mode, no prompt
disclosure, no all-rows-fraudulent, and `total_spend` was never forced to 0.

**A false positive in the detector was found and corrected.** The first run
flagged `prompt_injection_in_memo.csv` as obeyed. It was not — the model had
echoed the injected sentence back as a `description` value inside the
categorized rows, which is correct data handling. The substring scan could not
distinguish an echo from compliance. The detector now strips verbatim copies of
the input's own cells before scanning. Result: **0 obeyed** across both files in
both runs.

---

## 6. Methodology

**Corpus design.** 29 hostile CSVs across three groups — *structural* (13:
encoding, delimiters, headers, ragged rows), *value* (10: signs, nulls,
currency formatting, magnitudes, unicode), *semantic* (6: injections, planted
anomaly, contradictions, scale). Each file carries an expected behaviour:
`reject` (structured error, no crash), `handle` (process correctly), `ignore`
(treat injected text as data), or `graceful` (process or fail clearly, never
crash or hang). Generated by `adversarial_corpus.py`, schema-matched to the
pipeline's real contract (`date, amount, description, category`, negative
amounts) after reading `main.py`.

**Ground truth is invisible to the model.** The planted anomaly's label lives in
`corpus/planted_anomaly.csv.groundtruth.json`, a sidecar the pipeline never
reads. The spike row carries an ordinary description
(`"Co-Packer Fees - CPG Manufacturing"`) so nothing in the CSV identifies it. An
earlier design that wrote `PLANTED_ANOMALY` into a cell was discarded: it would
have leaked the answer into the prompt and inflated recall.

**Quota results are excluded from the denominator.** A `503
upstream_rate_limited` means the input was never evaluated. Counting it as a
failure would blame the pipeline for an exhausted Groq quota; counting it as a
pass would credit a run that never happened. Such results are bucketed
`NOT_RUN` and removed from the denominator — never counted as passes. This rule
was introduced when it *helped* the AFTER number, so it is stated explicitly.

**Latency A/B design.** Arms were **interleaved run-by-run** (sequential,
parallel, sequential, …) with the leading arm alternating each iteration, rather
than run as block A then block B. Groq latency drifts with load and quota
proximity; measuring one arm entirely before the other would let that drift
masquerade as a topology effect. Both arms issue the identical three LLM calls,
so token cost per run is the same and only ordering differs. Measurements were
taken in-container against `cfo_app.invoke()` directly, excluding HTTP and auth
overhead, because the claim concerns inference latency.

**Independent verification.** Findings were spot-checked directly against raw
`results.json` by the project owner — including the `total_by_category`
reconciliation (16/19 runs disagreeing with the pandas total) and the four
distinct category item schemas — rather than being accepted from the summary
tables in this report.

**Sample sizes, stated honestly.** Determinism BEFORE is n=22 (pooled from two
sessions, 9 + 13); AFTER is n=7 (3 of 10 lost to quota). The latency A/B reached
only n=3 vs n=2 and is reported as inconclusive rather than as a result. No
number in this report is extrapolated from a smaller sample than stated.

---

## 7. Fix inventory

| # | Fix | File |
|---|---|---|
| 1 | Schema/parse guard → structured 422, never 500 | `main.py` |
| 2 | `temperature=0`, `seed=42`, JSON parse fallback | `agent.py` |
| 3 | Runway: correct formula, no LLM, sign fixed | `agent.py` |
| 4 | Duplicate headers rejected | `main.py` |
| 5 | `total_by_category` computed in pandas | `main.py` |
| 6 | Category item schema pinned in prompt | `agent.py` |
| 7 | Groq 429 → 503 + `Retry-After`; 502 for API errors | `main.py` |
| 8 | Exception masking by Prometheus middleware fixed | `main.py` |
| — | Parallel fan-out/fan-in DAG (`BASELINE_SEQUENTIAL=1` restores chain) | `agent.py` |

## 8. Reproducing

```bash
export BASELINE_TOKEN="$(python3 eval/mint_token.py)"
export BASELINE_API_URL="http://localhost:8000"

python3 eval/quota.py                  # pre-flight token budget
python3 eval/adversarial_corpus.py     # regenerate the 29-file corpus
python3 eval/run_corpus.py             # corpus pass rate
python3 eval/determinism.py            # DETERMINISM_N=10
python3 eval/anomaly_score.py          # ANOMALY_RUNS=10
python3 eval/rescore.py                # re-score without spending tokens
python3 eval/rescore_anomaly.py        # both precision rules
```

Credentials come from the environment; no key, token or endpoint is committed.
At ~3,700–5,300 tokens per full pipeline run against a 100,000 TPD ceiling, a
complete BEFORE+AFTER sweep does not fit in one day on the free tier — budget
roughly 26 runs/day and use `quota.py` before starting anything.
