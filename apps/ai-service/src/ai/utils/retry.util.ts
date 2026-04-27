import Anthropic from '@anthropic-ai/sdk';

/**
 * Wraps an async function with exponential-backoff retries.
 *
 * Retry policy:
 * - 429 (rate limit) or 529 (overloaded) → retry with delay
 * - 400 / 401 (bad request / auth) → throw immediately (no point retrying)
 * - Any other error → retry up to maxAttempts
 *
 * Delay formula: baseDelayMs * 2^attempt  (800ms, 1600ms, 3200ms, ...)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 800,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Hard failures — no retry
      if (err instanceof Anthropic.APIError && (err.status === 400 || err.status === 401)) {
        throw err;
      }

      const isRetryable =
        err instanceof Anthropic.APIError && (err.status === 429 || err.status === 529);

      if (attempt < maxAttempts - 1 && isRetryable) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      // Non-retryable or last attempt — let it propagate after loop
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
