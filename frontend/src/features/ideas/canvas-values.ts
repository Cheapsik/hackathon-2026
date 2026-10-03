import type { CreateIdeaRequest, IdeaResponse } from '@/api/generated/castor'

/** The Canvas as the form holds it: empty text instead of null, so every field stays controlled. */
export interface IdeaCanvasValues {
  title: string
  challengeAreaCodes: string[]
  problemIntensity: number | null
  problemFrequency: number | null
  problemScale: number | null
  recipients: string[]
  otherRecipients: string
  solution: string
  stage: string
  supporters: string
  opponents: string
  emotionalValues: string[]
  functionalValues: string[]
  differenceNote: string
  startingInnovationId: string | null
}

export const emptyCanvas: IdeaCanvasValues = {
  title: '',
  challengeAreaCodes: [],
  problemIntensity: null,
  problemFrequency: null,
  problemScale: null,
  recipients: [],
  otherRecipients: '',
  solution: '',
  stage: 'IDEA',
  supporters: '',
  opponents: '',
  emotionalValues: [],
  functionalValues: [],
  differenceNote: '',
  startingInnovationId: null,
}

function levelOf(value: number | string | null): number | null {
  return value === null ? null : Number(value)
}

export function canvasValuesOf(idea: IdeaResponse): IdeaCanvasValues {
  return {
    title: idea.title,
    challengeAreaCodes: idea.challengeAreas.map((area) => area.code),
    problemIntensity: levelOf(idea.problemIntensity),
    problemFrequency: levelOf(idea.problemFrequency),
    problemScale: levelOf(idea.problemScale),
    recipients: idea.recipients,
    otherRecipients: idea.otherRecipients ?? '',
    solution: idea.solution ?? '',
    stage: idea.stage,
    supporters: idea.supporters ?? '',
    opponents: idea.opponents ?? '',
    emotionalValues: idea.emotionalValues,
    functionalValues: idea.functionalValues,
    differenceNote: idea.differenceNote ?? '',
    startingInnovationId: idea.startingInnovation?.id ?? null,
  }
}

export function canvasRequestOf(values: IdeaCanvasValues): CreateIdeaRequest {
  return {
    ...values,
    otherRecipients: values.otherRecipients || null,
    solution: values.solution || null,
    supporters: values.supporters || null,
    opponents: values.opponents || null,
    differenceNote: values.differenceNote || null,
  }
}
