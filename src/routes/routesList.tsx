import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DiagnosisPage from '@/pages/Diagnosis';
import HomePage from '@/pages/Home';
import LoginPage from '@/pages/Login';
import NotFoundPage from '@/pages/NotFound';
import StatisticsPage from '@/pages/Statistics';
import { RequireAuth } from './guards/RequireAuth';
import { PATH } from './routes';
import type { RouteObject } from 'react-router-dom';

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [{ path: PATH.LOGIN, element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: PATH.HOME, element: <HomePage /> },
          { path: `${PATH.STATISTICS}/:plantId?`, element: <StatisticsPage /> },
          { path: `${PATH.STATISTICS}/:plantId/:unitId/:no`, element: <StatisticsPage /> },
          { path: `${PATH.DIAGNOSIS}/:plantId?`, element: <DiagnosisPage /> },
          { path: `${PATH.DIAGNOSIS}/:plantId/:unitId/:no`, element: <DiagnosisPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
