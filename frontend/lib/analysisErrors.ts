/**
 * Structured error handling for /analyze.
 *
 * Response shapes, read directly from backend/main.py and backend/auth.py
 * rather than assumed:
 *
 *   parse_transactions() / analyze() -> HTTPException(detail={"error": CODE,
 *     "message": str, ...extra}).  FastAPI wraps this as {"detail": {...}}.
 *     extra varies by code: missing_columns carries {required, found};
 *     non_numeric_amount carries {examples}; duplicate_columns carries
 *     {columns} (the full header, not just the dupes — this module derives
 *     the actual duplicate names from it); invalid_encoding and malformed_csv
 *     carry {detail} (a raw exception string — internal, never shown).
 *
 *   auth.py's require_firebase_user() -> HTTPException(detail=<plain string>)
 *     on 401. Not the {error, message} shape — FastAPI wraps it as
 *     {"detail": "Missing or malformed Authorization header"}.
 *
 * Both shapes are handled. Nothing from a `detail` string field or a raw
 * exception message is ever rendered — only copy written in this file.
 */

export type AnalysisErrorCode =
  | 'invalid_encoding'
  | 'empty_file'
  | 'no_columns'
  | 'malformed_csv'
  | 'missing_columns'
  | 'duplicate_columns'
  | 'no_data_rows'
  | 'non_numeric_amount'
  | 'no_usable_rows'
  | 'non_finite_amount'
  | 'upstream_rate_limited'
  | 'upstream_error'
  | 'pipeline_failure'
  | 'auth_failed'
  | 'network';

export class AnalysisApiError extends Error {
  readonly status: number;
  readonly code: AnalysisErrorCode;
  /** required/found (missing_columns), examples (non_numeric_amount), duplicateColumns */
  readonly extra: Record<string, unknown>;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: AnalysisErrorCode,
    message: string,
    extra: Record<string, unknown> = {},
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'AnalysisApiError';
    this.status = status;
    this.code = code;
    this.extra = extra;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const KNOWN_CODES = new Set<AnalysisErrorCode>([
  'invalid_encoding', 'empty_file', 'no_columns', 'malformed_csv',
  'missing_columns', 'duplicate_columns', 'no_data_rows', 'non_numeric_amount',
  'no_usable_rows', 'non_finite_amount', 'upstream_rate_limited',
  'upstream_error', 'pipeline_failure',
]);

function isKnownCode(value: unknown): value is AnalysisErrorCode {
  return typeof value === 'string' && KNOWN_CODES.has(value as AnalysisErrorCode);
}

/** Reads the response body/headers and builds a typed error. Never throws. */
export async function parseErrorResponse(res: Response): Promise<AnalysisApiError> {
  const retryAfterHeader = res.headers.get('Retry-After');
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return new AnalysisApiError(res.status, 'network', 'The server sent an unreadable response.');
  }

  const detail = (body as { detail?: unknown } | null)?.detail;

  // Structured shape: {"detail": {"error": code, "message": str, ...extra}}
  if (detail && typeof detail === 'object') {
    const d = detail as Record<string, unknown>;
    const code = isKnownCode(d.error) ? d.error : undefined;
    const message = typeof d.message === 'string' ? d.message : 'Something went wrong.';

    if (code === 'duplicate_columns') {
      const columns = Array.isArray(d.columns) ? (d.columns as unknown[]).map(String) : [];
      const seen = new Set<string>();
      const dupes = new Set<string>();
      for (const c of columns) {
        const trimmed = c.trim();
        if (seen.has(trimmed)) dupes.add(trimmed);
        seen.add(trimmed);
      }
      return new AnalysisApiError(res.status, code, message, { duplicateColumns: [...dupes] });
    }

    if (code === 'missing_columns') {
      return new AnalysisApiError(res.status, code, message, {
        required: Array.isArray(d.required) ? d.required : [],
        found: Array.isArray(d.found) ? d.found : [],
      });
    }

    if (code === 'non_numeric_amount') {
      return new AnalysisApiError(res.status, code, message, {
        examples: Array.isArray(d.examples) ? d.examples : [],
      });
    }

    if (code) {
      return new AnalysisApiError(res.status, code, message, {}, retryAfterSeconds);
    }

    // Unrecognized {error, message} shape — future backend code this build
    // doesn't know about yet. `message` here is authored server copy (see
    // main.py's _reject calls), not a raw exception string, so it's safe to
    // show as-is rather than falling back to something generic.
    return new AnalysisApiError(res.status, 'pipeline_failure', message);
  }

  // Plain-string detail: auth.py's 401s, and its unconfigured-server 500.
  if (res.status === 401) {
    return new AnalysisApiError(res.status, 'auth_failed', 'Your session could not be renewed.');
  }

  return new AnalysisApiError(res.status, 'network', 'The server returned an unexpected error.');
}

interface ErrorCopy {
  title: string;
  body: (err: AnalysisApiError) => string;
}

export const ERROR_COPY: Record<AnalysisErrorCode, ErrorCopy> = {
  invalid_encoding: {
    title: 'File encoding not recognized',
    body: () => 'This file isn’t valid UTF-8 text. Re-save it as UTF-8 CSV and try again.',
  },
  empty_file: {
    title: 'File is empty',
    body: () => 'The uploaded file has no content. Choose a CSV with transaction rows.',
  },
  no_columns: {
    title: 'No columns found',
    body: () => 'No columns could be read from this file. Check that it’s a valid CSV.',
  },
  malformed_csv: {
    title: 'Rows don’t line up',
    body: () => 'Some rows have a different number of columns than the header. Check for stray commas.',
  },
  missing_columns: {
    title: 'Required columns missing',
    body: () => 'This file is missing one or more required columns.',
  },
  duplicate_columns: {
    title: 'Duplicate column name',
    body: () => 'Two or more columns share the same name. Rename one and re-upload.',
  },
  no_data_rows: {
    title: 'No data rows',
    body: () => 'The file has a header row but no transactions underneath it.',
  },
  non_numeric_amount: {
    title: 'Amount column has non-numeric values',
    body: () => 'Some values in the amount column aren’t numbers.',
  },
  no_usable_rows: {
    title: 'No usable rows',
    body: () => 'No row had both a valid date and a valid amount.',
  },
  non_finite_amount: {
    title: 'Invalid amount value',
    body: () => 'The amount column contains a value that isn’t a finite number.',
  },
  upstream_rate_limited: {
    title: 'Analysis engine is busy',
    body: (err) =>
      err.retryAfterSeconds
        ? `The LLM provider’s rate limit was reached. Try again in about ${err.retryAfterSeconds}s.`
        : 'The LLM provider’s rate limit was reached. Try again shortly.',
  },
  upstream_error: {
    title: 'Analysis engine error',
    body: () => 'The LLM provider returned an error. Try again in a moment.',
  },
  pipeline_failure: {
    title: 'Analysis failed',
    body: () => 'Something went wrong while analyzing this file. Try again in a moment.',
  },
  auth_failed: {
    title: 'Session couldn’t be renewed',
    body: () => 'Refresh the page and try again.',
  },
  network: {
    title: 'Couldn’t reach the server',
    body: () => 'Check your connection and try again.',
  },
};
