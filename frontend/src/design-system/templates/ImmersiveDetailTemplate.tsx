import { useId, type ReactNode } from 'react'
import { CategoryOrbit, type CategoryOrbitProps } from '../patterns/CategoryOrbit'
import { CurvedContentSheet } from '../patterns/CurvedContentSheet'
import { ImmersiveHero, type ImmersiveHeroProps } from '../patterns/ImmersiveHero'

export type ImmersiveDetailTemplateProps = {
  /** Full-bleed header: photo, controls, title (the page h1) and lead. */
  hero: Omit<ImmersiveHeroProps, 'children' | 'titleId' | 'titleAs' | 'className'>
  /** Optional row of round categories on the hero's lower edge; switches the sheet content. */
  categories?: CategoryOrbitProps
  /** One line of metadata above the sheet title, e.g. "Etap: przetestowane · Seniorzy". */
  meta?: ReactNode
  /** Sheet title (h2), at most two lines. */
  title: ReactNode
  /** Up to three lines of description. */
  description?: ReactNode
  /** Rail and further content of the sheet. */
  children?: ReactNode
  /** BottomActionDock with the one main action. */
  dock?: ReactNode
  /** Changes when the category changes, so the sheet content fades in again. */
  contentKey?: string
}

/**
 * Canonical detail screen (reference 1): immersive photo hero taking ~55% of a phone's height, centred title,
 * category orbit on the lower edge, and a light ceramic sheet overlapping it with a shallow concave arc.
 * From 1024 px the hero becomes a rounded media panel with the content panel beside it.
 */
export function ImmersiveDetailTemplate({
  hero,
  categories,
  meta,
  title,
  description,
  children,
  dock,
  contentKey,
}: ImmersiveDetailTemplateProps) {
  const heroTitleId = useId()
  const titleId = useId()

  return (
    <article
      aria-labelledby={heroTitleId}
      className="immersive-geometry mx-auto w-full max-w-shell lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(var(--container-aside),var(--container-panel))] lg:items-start lg:gap-6 lg:px-gutter-section lg:py-6"
    >
      <ImmersiveHero
        {...hero}
        titleId={heroTitleId}
        titleAs="h1"
        className="lg:sticky lg:top-6 lg:h-[min(40rem,calc(100dvh-3rem))] lg:rounded-shell"
      >
        {categories && <CategoryOrbit {...categories} />}
      </ImmersiveHero>

      <CurvedContentSheet labelledBy={titleId}>
        <div key={contentKey} className="grid w-full justify-items-center gap-4 animate-enter">
          {meta && (
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-label text-text-muted [&_svg]:size-icon-sm">
              {meta}
            </p>
          )}
          <h2 id={titleId} className="max-w-80 font-display text-value tracking-display">
            {title}
          </h2>
          {description && <p className="max-w-80 text-body-sm text-text-muted">{description}</p>}
          {children}
        </div>
        {dock}
      </CurvedContentSheet>
    </article>
  )
}
