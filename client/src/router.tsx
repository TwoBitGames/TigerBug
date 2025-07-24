import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { IssuePage } from './pages/IssuePage';
import { CreateIssuePage } from './pages/CreateIssuePage';

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
      }
    ]
  }
]);
