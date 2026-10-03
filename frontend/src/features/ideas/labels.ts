export const ideaStatusLabels: Record<string, string> = {
  DRAFT: 'szkic',
  SUBMITTED: 'zgłoszony, czeka na ocenę',
  ACCEPTED: 'przyjęty',
  REJECTED: 'odrzucony',
}

export const reviewRecommendationLabels: Record<string, string> = {
  DEVELOP: 'rozwijać',
  REVISE: 'dopracować',
  DECLINE: 'nie rozwijać',
}

/** The request fields the API names in missingForSubmission, as the Canvas calls them. */
export const missingFieldLabels: Record<string, string> = {
  challengeAreaCodes: 'obszar wyzwań (1-3)',
  problemIntensity: 'natężenie problemu',
  problemFrequency: 'częstotliwość problemu',
  problemScale: 'skala problemu',
  recipients: 'odbiorcy (z listy albo „inni”)',
  solution: 'opis rozwiązania',
}

export function ideaStatusLabel(status: string): string {
  return ideaStatusLabels[status] ?? status
}
