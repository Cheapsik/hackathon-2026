import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/*
 * tailwind-merge has to know the design-system scales (src/design-system/tokens.css). Without them it reads
 * `text-label` as a colour and drops it next to `text-text-muted`, or keeps both `rounded-card` and `rounded-pill`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['label', 'body-sm', 'body', 'lead', 'section-title', 'page-title', 'value', 'hero', 'eyebrow', 'logo'],
      font: ['sans', 'display', 'mono'],
      tracking: ['ui', 'display', 'hero'],
      radius: ['control', 'button', 'input', 'card', 'panel', 'shell'],
      shadow: ['contact', 'control', 'control-raised', 'primary', 'card', 'floating', 'on-media'],
      'drop-shadow': ['sheet'],
      blur: ['card', 'glass', 'dock'],
      ease: ['standard', 'spring'],
      animate: ['enter', 'fade-in', 'fade-out', 'pop-in', 'pop-out', 'sheet-in', 'sheet-out', 'shimmer'],
      spacing: ['gutter', 'gutter-section', 'touch', 'icon-sm', 'icon', 'icon-lg'],
      container: ['aside', 'narrow', 'panel', 'default', 'wide', 'shell'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
