import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  layout('layouts/admin.tsx', { id: 'admin' }, [
    route('dashboard', 'routes/dashboard.tsx'),
    route('products', 'routes/products.tsx'),
  ]),
] satisfies RouteConfig;
