function withFreshQuery(input: string) {
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(input, base)
    url.searchParams.set('_ts', Date.now().toString())

    if (url.origin === base) {
      return `${url.pathname}${url.search}${url.hash}`
    }

    return url.toString()
  } catch {
    const separator = input.includes('?') ? '&' : '?'
    return `${input}${separator}_ts=${Date.now()}`
  }
}

export async function fetchJsonWithRetry<T>(
  input: string,
  init?: RequestInit,
  retries = 2
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(withFreshQuery(input), {
        ...init,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
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
