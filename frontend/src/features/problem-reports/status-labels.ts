/** The report statuses in the words of the UI (SPEC §7 V). */
export const problemReportStatusLabels: Record<string, string> = {
  RECEIVED: 'przyjęte',
  IN_ANALYSIS: 'w analizie',
  WITH_EXPERT: 'u eksperta',
  ANSWERED: 'odpowiedź',
  CLOSED: 'zamknięte',
}

export function statusLabel(status: string): string {
  return problemReportStatusLabels[status] ?? status
}
