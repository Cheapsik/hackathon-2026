import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RegisterPage } from '@/features/account/RegisterPage'
import { AdminHomePage } from '@/features/admin/AdminHomePage'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { GenomePage } from '@/features/admin/GenomePage'
import { GrantCallApplicationsPage } from '@/features/admin/GrantCallApplicationsPage'
import { GrantCallsPage } from '@/features/admin/GrantCallsPage'
import { IdeasAdminPage } from '@/features/admin/IdeasAdminPage'
import { InboxPage } from '@/features/admin/InboxPage'
import { InboxReportPage } from '@/features/admin/InboxReportPage'
import { InnovationFormPage } from '@/features/admin/InnovationFormPage'
import { KnowledgePage } from '@/features/admin/KnowledgePage'
import { RadarPage } from '@/features/admin/RadarPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { SignInPage } from '@/features/account/SignInPage'
import { AskExpertPage } from '@/features/conversations/AskExpertPage'
import { ConversationPage } from '@/features/conversations/ConversationPage'
import { ConversationsPage } from '@/features/conversations/ConversationsPage'
import { HomePage } from '@/features/home/HomePage'
import { GrantApplicationPage } from '@/features/ideas/GrantApplicationPage'
import { IdeaPage } from '@/features/ideas/IdeaPage'
import { IdeasPage } from '@/features/ideas/IdeasPage'
import { NewIdeaPage } from '@/features/ideas/NewIdeaPage'
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
      { path: 'watki', element: <ConversationsPage /> },
      { path: 'watki/:conversationId', element: <ConversationPage /> },
      { path: 'zapytaj-eksperta', element: <AskExpertPage /> },
      { path: 'innowacje/:innovationId', element: <InnovationPage /> },
      { path: 'pomysly', element: <IdeasPage /> },
      { path: 'pomysly/nowy', element: <NewIdeaPage /> },
      { path: 'pomysly/:ideaId', element: <IdeaPage /> },
      { path: 'wnioski/:grantApplicationId', element: <GrantApplicationPage /> },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHomePage /> },
          { path: 'zgloszenia', element: <InboxPage /> },
          { path: 'zgloszenia/:problemReportId', element: <InboxReportPage /> },
          { path: 'radar', element: <RadarPage /> },
          { path: 'wiedza', element: <KnowledgePage /> },
          { path: 'wiedza/genomy/:genomeId', element: <GenomePage /> },
          { path: 'wiedza/innowacje/nowa', element: <InnovationFormPage /> },
          { path: 'wiedza/innowacje/:innovationId', element: <InnovationFormPage /> },
          { path: 'pomysly', element: <IdeasAdminPage /> },
          { path: 'nabory', element: <GrantCallsPage /> },
          { path: 'nabory/:grantCallId/wnioski', element: <GrantCallApplicationsPage /> },
          { path: 'uzytkownicy', element: <UsersPage /> },
        ],
      },
      { path: 'logowanie', element: <SignInPage /> },
      { path: 'rejestracja', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
