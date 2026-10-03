import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/not-found/NotFoundPage'
import { NewProblemReportPage } from '@/features/problem-reports/NewProblemReportPage'

/*
 * Design-system preview: development only. import.meta.env.DEV is replaced at build time, so in production this
 * is an empty array and the preview code is not even bundled.
 */
const developmentRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/design-system',
        lazy: async () => ({
          Component: (await import('@/features/design-system-preview/DesignSystemPage')).DesignSystemPage,
        }),
      },
      {
        path: '/design-system/szablon/:templateId',
        lazy: async () => ({
          Component: (await import('@/features/design-system-preview/TemplateFramePage')).TemplateFramePage,
        }),
      },
    ]
  : []

export const router = createBrowserRouter([
  ...developmentRoutes,
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'opisz-problem', element: <NewProblemReportPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
