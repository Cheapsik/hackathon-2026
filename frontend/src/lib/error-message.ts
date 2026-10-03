import { ApiError } from '@/api/castor-fetch'

const generalFailure = 'Coś poszło nie tak. Spróbuj ponownie za chwilę.'
const tooManyRequests = 'Wysłano zbyt wiele zapytań. Odczekaj minutę i spróbuj ponownie.'

/**
 * A Polish sentence for a failed request. The backend explains refusals in English (docs/architecture), so each
 * screen names the cases its user can fix by status code; anything else gets a general sentence.
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

  return generalFailure
}
