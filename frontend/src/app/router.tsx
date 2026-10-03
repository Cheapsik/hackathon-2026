import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RegisterPage } from '@/features/account/RegisterPage'
import { SignInPage } from '@/features/account/SignInPage'
import { HomePage } from '@/features/home/HomePage'
import { InnovationPage } from '@/features/innovations/InnovationPage'
import { NotFoundPage } from '@/features/not-found/NotFoundPage'
import { DescribeProblemPage } from '@/features/problem-reports/DescribeProblemPage'
import { MyProblemReportsPage } from '@/features/problem-reports/MyProblemReportsPage'
import { TrackProblemReportPage } from '@/features/problem-reports/TrackProblemReportPage'

export const router = createBrowserRouter([
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
