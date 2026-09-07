import { useEscrowStore } from "@/features/escrow/escrow-store";

export const MAX_RETRIES = 3;
export const BASE_BACKOFF_MS = 500;

export function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("network") ||
    lower.includes("connection") ||
    lower.includes("fetch") ||
    lower.includes("econnreset") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("429")
  );
}

export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("econnreset") ||
    lower.includes("connection refused") ||
    lower.includes("econnrefused")
  );
}

export function userErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return "Сеть недоступна. Проверьте подключение.";
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("timeout")) {
    return "Таймаут запроса. Повторная попытка...";
  }
  return message;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseBackoffMs: number = BASE_BACKOFF_MS,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isTransientError(error)) {
        throw error;
      }

      // Exponential backoff: base * 2^attempt
      const delay = baseBackoffMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<T | null> {
  try {
    const result = await withRetry(fn);
    useEscrowStore.getState().setError(null);
    return result;
  } catch (error) {
    const message = userErrorMessage(error);
    useEscrowStore.getState().setError(message);
    return null;
  }
}
