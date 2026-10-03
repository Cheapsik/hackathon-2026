import { useLayoutEffect, type RefObject } from 'react'
import { prefersReducedMotion } from './motion'

/** Share of the pointer's offset from the centre that the element follows, and the most it may travel (px). */
const PULL = 0.28
const MAX_TRAVEL = 7

/** The element leans towards the pointer while it hovers over it. Mouse only; reduced motion turns it off. */
export function useMagnetic(target: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = target.current
    if (!element || prefersReducedMotion()) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const clamp = (value: number) => Math.max(-MAX_TRAVEL, Math.min(MAX_TRAVEL, value))

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      element.style.translate = `${clamp(dx * PULL)}px ${clamp(dy * PULL)}px`
    }
    const onLeave = () => {
      element.style.translate = ''
    }

    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerleave', onLeave)

    return () => {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerleave', onLeave)
      element.style.translate = ''
    }
  }, [target])
}
