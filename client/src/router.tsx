import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { IssuePage } from './pages/IssuePage';
import { CreateIssuePage } from './pages/CreateIssuePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { TodoPage } from './pages/TodoPage';

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
        path: '/admin',
        element: <AdminDashboard />
      }
    ]
  },
  {
    path: '/verify-email',
    element: <EmailVerificationPage />
  }
]);
