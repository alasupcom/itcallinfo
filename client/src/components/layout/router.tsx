import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/dashboard';
import Login from '@/pages/login';
import Register from '@/pages/register';
import NotFound from '@/pages/notFound';
import BrowserPhoneIntegration from '@/components/BrowserPhoneIntegration/BrowserPhoneIntegration';
import { RouterContext } from '@/types/api/auth';
import VocalChatUI from '@/pages/vicalChat';

const AuthCheckingLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      <span>Checking authentication...</span>
    </div>
  </div>
);

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth layout for login/register
const authRoute = createRoute({
  path: 'auth',
  getParentRoute: () => rootRoute,
  component: () => <Outlet />,
  beforeLoad: ({ context }: { context: RouterContext }) => {
    // Only redirect if we're sure about authentication state
    if (context.auth?.isAuthenticated === true) {
      throw redirect({ to: '/dashboard' });
    }
    
    // If we're still loading auth state, we don't redirect yet
    if (context.auth?.isLoading === true) {
      return { pendingAuth: true };
    }
  },
});

const loginRoute = createRoute({
  path: 'login',
  getParentRoute: () => authRoute,
  component: Login,
});

const registerRoute = createRoute({
  path: 'register',
  getParentRoute: () => authRoute,
  component: Register,
});

// Protected route layout
const protectedRoute = createRoute({
  id: 'protected',
  getParentRoute: () => rootRoute,
  component: ({ pendingAuth }) => {
    if (pendingAuth) {
      return <AuthCheckingLoader />;
    }
    return <AppLayout><Outlet /></AppLayout>;
  },
  beforeLoad: ({ context }: { context: RouterContext }) => {
    // Only redirect if we're sure the user is not authenticated
    if (context.auth?.isAuthenticated === false && context.auth?.isLoading === false) {
      throw redirect({ to: '/auth/login' });
    }
    
    // If we're still loading auth state, we pass a flag to show a loader
    if (context.auth?.isLoading === true) {
      return { pendingAuth: true };
    }
    
    return { pendingAuth: false };
  },
});

// Root path redirect
const indexRoute = createRoute({
  path: '/',
  getParentRoute: () => rootRoute,
  beforeLoad: ({ context }: { context: RouterContext }) => {
    // Don't redirect while auth is loading
    if (context.auth?.isLoading === true) {
      return { pendingAuth: true };
    }
    
    // Redirect based on auth status once we know it
    if (context.auth?.isAuthenticated === true) {
      throw redirect({ to: '/dashboard' });
    } else {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: AuthCheckingLoader,
});

// Dashboard page inside protected layout
const dashboardRoute = createRoute({
  path: 'dashboard',
  getParentRoute: () => protectedRoute,
  component: Dashboard,
});

// Call page inside protected layout
const callRoute = createRoute({
  path: 'call',
  getParentRoute: () => protectedRoute,
  component: BrowserPhoneIntegration,
});

// const vocalChatRoute = createRoute({
//   path: 'vocal-chat',
//   getParentRoute: () => protectedRoute,
//   component: VocalChatUI,
// });

// Not found route
const notFoundRoute = createRoute({
  path: '*',
  getParentRoute: () => rootRoute,
  component: NotFound,
});

// Router definition
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    authRoute.addChildren([loginRoute, registerRoute]),
    protectedRoute.addChildren([dashboardRoute, callRoute]),
    notFoundRoute
  ]),
  context: {
    auth: {
      isAuthenticated: false,
      user: null,
      isLoading: true
    },
  },
});