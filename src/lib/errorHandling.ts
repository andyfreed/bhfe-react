/**
 * Utility to safely handle async operations with proper error tracing
 */
export async function safeAsync<T>(promise: Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    console.error('API Error:', error);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Wraps fetch API with better error handling
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<[Response | null, Error | null]> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    return [response, null];
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
} 