export async function fetchJsonWithRetry<T>(
  input: string,
  init?: RequestInit,
  retries = 2
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...init,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          ...(init?.headers ?? {}),
        },
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}
