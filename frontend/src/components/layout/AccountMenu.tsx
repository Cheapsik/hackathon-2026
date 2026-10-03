import { UserRound } from 'lucide-react'
import { Popover } from 'radix-ui'
import { Link } from 'react-router'
import { usePostApiAuthSignOut } from '@/api/generated/castor'
import { SoftButton, Tooltip } from '@/design-system'
import { useRefreshSession, useSession } from '@/hooks/use-session'

/** The round account control of the home page header, on the dusk frame. */
const circleClassName =
  'inline-grid size-touch shrink-0 place-items-center rounded-button border border-on-frame-line text-on-frame transition-control press hover:bg-on-frame-line data-[state=open]:bg-on-frame-line'

/**
 * Header account control, the same circle as on the home page. A visitor goes to sign-in (registration is linked
 * from there); a signed-in user sees their initial and opens a panel with the e-mail and "Wyloguj się".
 */
export function AccountMenu() {
  const session = useSession()
  const signOut = usePostApiAuthSignOut()
  const refreshSession = useRefreshSession()

  if (!session) {
    return null
  }

  if (!session.signedIn) {
    return (
      <Tooltip content="Zaloguj się" side="bottom">
        <Link to="/logowanie" aria-label="Zaloguj się" className={circleClassName}>
          <UserRound aria-hidden className="size-icon" strokeWidth={1.75} />
        </Link>
      </Tooltip>
    )
  }

  const initial = session.email?.trim().charAt(0).toUpperCase() || undefined

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" aria-label={`Konto: ${session.email ?? 'zalogowano'}`} className={circleClassName}>
          {initial ? (
            <span aria-hidden className="text-body-sm font-semibold">
              {initial}
            </span>
          ) : (
            <UserRound aria-hidden className="size-icon" strokeWidth={1.75} />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 grid w-[min(20rem,calc(100vw-2.5rem))] gap-4 rounded-card p-5 text-text-primary surface-overlay animate-pop-in data-[state=closed]:animate-pop-out"
        >
          <div className="grid gap-1">
            <p className="text-label text-text-muted">Zalogowano jako</p>
            <p className="text-body font-medium break-all">{session.email}</p>
          </div>
          <SoftButton
            variant="secondary"
            loading={signOut.isPending}
            onClick={() => signOut.mutate(undefined, { onSuccess: refreshSession })}
          >
            Wyloguj się
          </SoftButton>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
