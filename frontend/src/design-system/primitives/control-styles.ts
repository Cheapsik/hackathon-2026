import { cn } from '@/lib/utils'

/** Shared look of text-like controls: TextField, TextAreaField, SearchField, SelectField. */
export const controlClassName = cn(
  'w-full min-h-touch rounded-input border border-border-strong bg-surface-glass-strong px-4 text-body text-text-primary',
  'shadow-control transition-control placeholder:text-text-faint',
  'hover:border-text-muted aria-invalid:border-danger aria-invalid:bg-danger-soft',
  'disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-surface-solid',
)
