const numberFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })
const dateTimeFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' })

export function formatNumber(value: number | string): string {
  return numberFormat.format(Number(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value))
}

/** "3 godz. temu" — how long a report has been waiting, for the inbox (SPEC §7 VI). */
export function timeSince(value: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / 60000))
  if (minutes < 60) {
    return `${minutes} min temu`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    return `${hours} godz. temu`
  }

  return `${Math.floor(hours / 24)} dni temu`
}

/**
 * The Polish word form for a count: `one` for 1, `few` for 2-4 (but not 12-14) and their tens, `many` otherwise -
 * "1 innowacja", "3 innowacje", "5 innowacji".
 */
export function pluralPl(count: number, one: string, few: string, many: string): string {
  if (count === 1) {
    return one
  }

  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14) ? few : many
}

/** A list edited in a textarea: one item per line. */
export function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}
