import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
} from '@tanstack/react-router';

import dashboard from '@/pages/dashboard';
import NotFound from '@/pages/notFound';
import AppLayout from './AppLayout';

const rootRoute = createRootRoute({
    component: () => <AppLayout> <Outlet /> </AppLayout>,
});


const dashboardRoute = createRoute({ path: '/', getParentRoute: () => rootRoute, component: dashboard });

const notFoundRoute = createRoute({
    path: '*',
    getParentRoute: () => rootRoute,
    component: NotFound,
});

export const router = createRouter({
    routeTree: rootRoute.addChildren([
        dashboardRoute,
        notFoundRoute,
    ]),
});
