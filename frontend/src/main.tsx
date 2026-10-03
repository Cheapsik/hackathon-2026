import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import { applyDisplayPreferences, readDisplayPreferences } from '@/lib/display-preferences'
import './index.css'

// Before the first render, so the page never flashes at the default size or contrast.
applyDisplayPreferences(readDisplayPreferences())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
