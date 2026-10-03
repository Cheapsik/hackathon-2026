/** The id of a YouTube watch link, so the card can embed the film without cookies. */
export function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null
    }
    if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') {
      return parsed.searchParams.get('v')
    }
  } catch {
    return null
  }

  return null
}
