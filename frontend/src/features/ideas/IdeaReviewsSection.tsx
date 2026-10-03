import { useState, type FormEvent } from 'react'
import { usePutApiIdeasIdeaIdReview, type IdeaResponse } from '@/api/generated/castor'
import { reviewRecommendationLabels } from '@/features/ideas/labels'
import { errorMessage } from '@/lib/error-message'
import { formatDateTime } from '@/lib/format'

interface IdeaReviewsSectionProps {
  idea: IdeaResponse
  onUpdated: (idea: IdeaResponse) => void
}

/** Expert reviews: anonymous to the authors; an expert of the idea's areas writes or revises theirs. */
export function IdeaReviewsSection({ idea, onUpdated }: IdeaReviewsSectionProps) {
  const reviews = idea.reviews

  if (reviews === null && !idea.canReview && !idea.myReview) {
    return null
  }

  return (
    <section aria-labelledby="idea-reviews-title">
      <h2 id="idea-reviews-title">Oceny ekspertów</h2>
      {reviews !== null && reviews.length === 0 && <p>Pomysł nie ma jeszcze ocen.</p>}
      {reviews !== null && reviews.length > 0 && (
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>{review.mine ? 'Twoja ocena' : 'Ekspert'}:</strong> {reviewRecommendationLabels[review.recommendation] ?? review.recommendation}{' '}
              ({formatDateTime(review.updatedAt)}). {review.comment}
            </li>
          ))}
        </ul>
      )}
      {reviews === null && idea.myReview && !idea.canReview && (
        <p>
          Twoja ocena: {reviewRecommendationLabels[idea.myReview.recommendation] ?? idea.myReview.recommendation}. {idea.myReview.comment}
        </p>
      )}
      {idea.canReview && <ReviewForm idea={idea} onUpdated={onUpdated} />}
    </section>
  )
}

function ReviewForm({ idea, onUpdated }: IdeaReviewsSectionProps) {
  const [recommendation, setRecommendation] = useState(idea.myReview?.recommendation ?? 'DEVELOP')
  const [comment, setComment] = useState(idea.myReview?.comment ?? '')
  const [saved, setSaved] = useState(false)
  const review = usePutApiIdeasIdeaIdReview()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    review.mutate(
      { ideaId: idea.id, data: { recommendation, comment } },
      {
        onSuccess: (response) => {
          setSaved(true)
          onUpdated(response.data)
        },
      },
    )
  }

  return (
    <form onSubmit={submit}>
      <fieldset>
        <legend>{idea.myReview ? 'Popraw swoją ocenę' : 'Twoja ocena jako eksperta'}</legend>
        {Object.entries(reviewRecommendationLabels).map(([value, label]) => (
          <label key={value}>
            <input type="radio" name="recommendation" value={value} checked={recommendation === value} onChange={() => setRecommendation(value)} /> {label}
            <br />
          </label>
        ))}
        <label>
          Uzasadnienie (widzą je autorzy, bez Twojego nazwiska)
          <br />
          <textarea rows={4} cols={70} required maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} />
        </label>
        <br />
        <button type="submit" disabled={review.isPending}>
          Zapisz ocenę
        </button>
      </fieldset>
      <div aria-live="polite">
        {saved && <p>Ocena zapisana.</p>}
        {review.isError && (
          <p role="alert">
            {errorMessage(review.error, {
              400: 'Napisz uzasadnienie oceny.',
              403: 'Możesz oceniać tylko pomysły ze swoich obszarów.',
              409: 'Ten pomysł ma już decyzję ROPS.',
            })}
          </p>
        )}
      </div>
    </form>
  )
}
