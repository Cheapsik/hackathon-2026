/** The system setting, or the "reduce motion" switch of the display preferences (data-motion on <html>). */
export function prefersReducedMotion() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce'
  )
}
