/** A refusal from the API: its status and the sentence the backend wrote for the user. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const fallbackMessage = 'Coś poszło nie tak. Spróbuj ponownie za chwilę.'

/**
 * The fetch every generated client call goes through. Same origin, so the session cookie travels on its own.
 * A non-2xx answer becomes an ApiError, so TanStack Query sees it as an error, not as data.
 */
export async function castorFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'same-origin' })
  const text = await response.text()
  const data: unknown = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    throw new ApiError(response.status, errorMessageOf(data))
  }

  return { data, status: response.status, headers: response.headers } as T
}

function errorMessageOf(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
    return data.error
  }

  return fallbackMessage
}
