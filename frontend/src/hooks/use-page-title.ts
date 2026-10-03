import { useEffect } from 'react'

/** Every page names itself in the browser tab; screen readers announce it after navigation. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Castor`
  }, [title])
}
