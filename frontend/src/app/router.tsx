import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RegisterPage } from '@/features/account/RegisterPage'
import { SignInPage } from '@/features/account/SignInPage'
import { HomePage } from '@/features/home/HomePage'
import { InnovationPage } from '@/features/innovations/InnovationPage'
import { NotFoundPage } from '@/features/not-found/NotFoundPage'
import { DescribeProblemPage } from '@/features/problem-reports/DescribeProblemPage'
import { MyProblemReportsPage } from '@/features/problem-reports/MyProblemReportsPage'
import { TrackProblemReportPage } from '@/features/problem-reports/TrackProblemReportPage'

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
      { path: 'opisz-problem', element: <DescribeProblemPage /> },
      { path: 'sledz', element: <TrackProblemReportPage /> },
      { path: 'zgloszenie/:trackingCode', element: <TrackProblemReportPage /> },
      { path: 'moje-zgloszenia', element: <MyProblemReportsPage /> },
      { path: 'innowacje/:innovationId', element: <InnovationPage /> },
      { path: 'logowanie', element: <SignInPage /> },
      { path: 'rejestracja', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
