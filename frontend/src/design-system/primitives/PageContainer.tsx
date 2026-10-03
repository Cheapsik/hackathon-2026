import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const widthClass = {
  narrow: 'max-w-narrow',
  default: 'max-w-default',
  wide: 'max-w-wide',
} as const

export type PageContainerProps = ComponentProps<'div'> & {
  /** narrow: forms and auth (480 px); default: reading (720 px); wide: product pages (1240 px of content, 32 px margins). */
  width?: keyof typeof widthClass
}

/** Horizontal rhythm of a page: centred column, 16 px gutter on phones, 24 px from tablet up. */
export function PageContainer({ width = 'wide', className, ...props }: PageContainerProps) {
  return <div className={cn('mx-auto w-full px-gutter md:px-gutter-section', widthClass[width], className)} {...props} />
}
