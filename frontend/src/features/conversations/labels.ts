export const conversationKindLabels: Record<string, string> = {
  PROBLEM_REPORT: 'Zgłoszenie',
  EXPERT_QUESTION: 'Pytanie do ekspertów',
  PARTNERSHIP: 'Współpraca przy innowacji',
}

/** Who wrote a message, from the reader's side. The initiator of a report thread is its author. */
export function senderLabel(senderRole: string, mine: boolean, kind: string): string {
  if (mine) {
    return 'Ty'
  }

  switch (senderRole) {
    case 'ADMIN':
      return 'ROPS'
    case 'EXPERT':
      return 'Ekspert'
    case 'INNOVATION_TEAM':
      return 'Zespół innowacji'
    case 'INITIATOR':
      return kind === 'PROBLEM_REPORT' ? 'Autor zgłoszenia' : 'Autor wątku'
    default:
      return senderRole
  }
}
