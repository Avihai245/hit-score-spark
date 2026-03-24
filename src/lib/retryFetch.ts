/**
 * Retry utility with exponential backoff for all external API calls.
 */

export interface RetryOptions {
  retries?: number;
  backoff?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryError extends Error {
  attempts: number;
  lastError: Error;
  constructor(message: string, attempts: number, lastError: Error) {
    super(message);
    this.name = "RetryError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const { retries = 3, backoff = 1000, timeout = 30000, onRetry } = retryOptions;
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok || response.status === 404 || response.status === 401) return response;
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new RetryError(lastError.message, attempt, lastError);
      }
    } catch (err) {
      if (err instanceof RetryError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < retries) {
      onRetry?.(attempt, lastError);
      await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt - 1)));
    }
  }
  throw new RetryError(`Failed after ${retries} attempts: ${lastError.message}`, retries, lastError);
}

export async function retryAsync<T>(fn: () => Promise<T>, retryOptions: RetryOptions = {}): Promise<T> {
  const { retries = 3, backoff = 1000, onRetry } = retryOptions;
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        onRetry?.(attempt, lastError);
        await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw new RetryError(`Failed after ${retries} attempts: ${lastError.message}`, retries, lastError);
}
