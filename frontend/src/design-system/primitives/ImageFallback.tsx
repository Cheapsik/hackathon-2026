import { useState, type ComponentProps } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ImageFallbackProps = Omit<ComponentProps<'img'>, 'src' | 'alt' | 'width' | 'height'> & {
  src?: string | null
  /** Required: describe the image, or pass "" when it is pure decoration. */
  alt: string
  /** Intrinsic size; reserves space so nothing shifts when the image arrives. */
  width: number
  height: number
  /** Shown on the neutral fallback surface when there is no image or it failed to load. */
  fallbackLabel?: string
  /** `cover` fills the box (heroes, media chips); `contain` keeps the whole image. */
  fit?: 'cover' | 'contain'
  /** Plain fallback surface without the "no image" icon — for backgrounds under other content. */
  hideFallbackIcon?: boolean
}

/**
 * Image with reserved space, lazy loading and a calm neutral fallback when the source is missing or broken.
 * The fallback keeps the alt text available to screen readers.
 */
export function ImageFallback({
  src,
  alt,
  width,
  height,
  fallbackLabel,
  fit = 'cover',
  hideFallbackIcon = false,
  className,
  loading = 'lazy',
  ...props
}: ImageFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showFallback = !src || failedSrc === src

  if (showFallback) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        style={{ aspectRatio: `${width} / ${height}` }}
        className={cn('grid place-items-center overflow-hidden media-fallback', className)}
      >
        {!hideFallbackIcon && (
          <span className="grid justify-items-center gap-2 p-4 text-center">
            <ImageOff aria-hidden className="size-icon-lg" strokeWidth={1.5} />
            {fallbackLabel && <span className="text-label">{fallbackLabel}</span>}
          </span>
        )}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={cn(fit === 'cover' ? 'object-cover' : 'object-contain', 'bg-media', className)}
      {...props}
    />
  )
}
