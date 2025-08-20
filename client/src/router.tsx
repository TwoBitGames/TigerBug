import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { IssuePage } from './pages/IssuePage';
import { CreateIssuePage } from './pages/CreateIssuePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { TodoPage } from './pages/TodoPage';
import { CrashReportsPage } from './pages/CrashReportsPage';
import { UserManagement } from './components/admin/UserManagement';
import { ProjectManagement } from './components/admin/ProjectManagement';
import { SMTPConfiguration } from './components/admin/SMTPConfiguration';
import { BrandingConfiguration } from './components/admin/BrandingConfiguration';
import { OAuthConfiguration } from './components/admin/OAuthConfiguration';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: '/todo',
        element: <TodoPage />
      },
      {
        path: '/projects/:projectId',
        element: <ProjectPage />
      },
      {
        path: '/projects/:projectId/issues/:issueId',
        element: <IssuePage />
      },
      {
        path: '/projects/:projectId/create-issue',
        element: <CreateIssuePage />
      },
      {
        path: '/projects/:projectId/crash-reports',
        element: <CrashReportsPage />
      },
      {
        path: '/admin',
        element: <AdminDashboard />,
        children: [
          {
            index: true,
            element: <UserManagement />
          },
          {
            path: 'users',
            element: <UserManagement />
          },
          {
            path: 'projects',
            element: <ProjectManagement />
          },
          {
            path: 'smtp',
            element: <SMTPConfiguration />
          },
          {
            path: 'branding',
            element: <BrandingConfiguration />
          },
          {
            path: 'oauth',
            element: <OAuthConfiguration />
          }
        ]
      }
    ]
  },
  {
    path: '/verify-email',
    element: <EmailVerificationPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    path: '/oauth/callback',
    element: <OAuthCallbackPage />
  }
]);
