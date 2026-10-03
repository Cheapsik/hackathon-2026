import { useLayoutEffect, type RefObject } from 'react'
import { prefersReducedMotion } from './motion'

type HeroMotionRefs = {
  root: RefObject<HTMLElement | null>
  photo: RefObject<HTMLElement | null>
  wordmark: RefObject<HTMLElement | null>
}

/** Pixels the photo travels across the page. Kept below the CSS photo bleed so rounded corners never flash dusk. */
const PHOTO_TRAVEL = { x: 28, y: 18 }
/**
 * The wordmark hangs behind the towers, so it travels only this share of the photo's distance and the church
 * slides across it. It lives inside the photo layer, so its own transform carries just the difference.
 */
const WORDMARK_DEPTH = 0.3

/**
 * Pointer parallax on the still. Entry choreography lives in CSS so the page does not depend on
 * Vite's prebundled GSAP chunk (that import currently 504s in this workspace).
 */
export function useHeroMotion({ root, photo, wordmark }: HeroMotionRefs) {
  useLayoutEffect(() => {
    const rootEl = root.current
    const photoEl = photo.current
    const wordmarkEl = wordmark.current
    if (!rootEl || !photoEl || !wordmarkEl || prefersReducedMotion()) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const tick = () => {
      currentX += (targetX - currentX) * 0.06
      currentY += (targetY - currentY) * 0.06
      photoEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      const lag = WORDMARK_DEPTH - 1
      wordmarkEl.style.transform = `translate3d(${currentX * lag}px, ${currentY * lag}px, 0)`
      frame = window.requestAnimationFrame(tick)
    }

    const onPointer = (event: PointerEvent) => {
      const rect = rootEl.getBoundingClientRect()
      const nx = (event.clientX - rect.left) / rect.width - 0.5
      const ny = (event.clientY - rect.top) / rect.height - 0.5
      targetX = nx * -PHOTO_TRAVEL.x
      targetY = ny * -PHOTO_TRAVEL.y
    }

    rootEl.addEventListener('pointermove', onPointer)
    frame = window.requestAnimationFrame(tick)

    return () => {
      rootEl.removeEventListener('pointermove', onPointer)
      window.cancelAnimationFrame(frame)
      photoEl.style.transform = ''
      wordmarkEl.style.transform = ''
    }
  }, [root, photo, wordmark])
}
