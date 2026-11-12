import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RouteError } from '@/components/layout/RouteError';
import { routes } from '@/routes/routesList';

const router = createBrowserRouter([{ errorElement: <RouteError />, children: routes }]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
