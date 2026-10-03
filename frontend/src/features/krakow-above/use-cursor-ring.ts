import { useLayoutEffect, type RefObject } from 'react'
import { prefersReducedMotion } from './motion'

const INTERACTIVE = 'a, button, textarea, input, [data-cursor]'

type CursorRingRefs = {
  root: RefObject<HTMLElement | null>
  ring: RefObject<HTMLElement | null>
}

/**
 * Trailing ring with a centre dot in place of the system cursor. The ring grows over links, buttons and the
 * field. Mouse only; off with reduced motion (system cursor stays then).
 */
export function useCursorRing({ root, ring }: CursorRingRefs) {
  useLayoutEffect(() => {
    const rootEl = root.current
    const ringEl = ring.current
    if (!rootEl || !ringEl || prefersReducedMotion()) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let x = 0
    let y = 0
    let seen = false

    const tick = () => {
      x += (targetX - x) * 0.2
      y += (targetY - y) * 0.2
      ringEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      frame = window.requestAnimationFrame(tick)
    }

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      if (!seen) {
        seen = true
        x = targetX
        y = targetY
        ringEl.dataset.visible = 'true'
      }
      const over = event.target instanceof Element && event.target.closest(INTERACTIVE) !== null
      ringEl.dataset.active = over ? 'true' : 'false'
    }
    const onLeave = () => {
      ringEl.dataset.visible = 'false'
      seen = false
    }

    rootEl.addEventListener('pointermove', onMove)
    rootEl.addEventListener('pointerleave', onLeave)
    frame = window.requestAnimationFrame(tick)

    return () => {
      rootEl.removeEventListener('pointermove', onMove)
      rootEl.removeEventListener('pointerleave', onLeave)
      window.cancelAnimationFrame(frame)
      delete ringEl.dataset.visible
      delete ringEl.dataset.active
    }
  }, [root, ring])
}
