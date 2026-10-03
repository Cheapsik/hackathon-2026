import { ApiError } from '@/api/castor-fetch'

const generalFailure = 'Coś poszło nie tak. Spróbuj ponownie za chwilę.'
const tooManyRequests = 'Wysłano zbyt wiele zapytań. Odczekaj minutę i spróbuj ponownie.'

/**
 * A Polish sentence for a failed request. Each screen can name the cases its user can fix by status code. When it
 * does not, the sentence from the API body (`{ error }`) is shown; otherwise a general sentence.
 */
export function errorMessage(error: unknown, byStatus: Partial<Record<number, string>> = {}): string {
  if (!(error instanceof ApiError)) {
    return generalFailure
  }

  const known = byStatus[error.status]
  if (known) {
    return known
  }

  if (error.status === 429) {
    return tooManyRequests
  }

  if (error.message.trim()) {
    return error.message
  }

  return generalFailure
}
