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
import ProfilePage from '@/pages/profile';
import SettingsPage from '@/pages/settings';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserDetail from '@/pages/admin/UserDetail';
import SipConfigManagement from '@/pages/admin/SipConfigManagement';

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
      // Redirect based on user role
      if (context.auth?.user?.role === 'admin') {
        throw redirect({ to: '/admin/dashboard' });
      } else {
        throw redirect({ to: '/dashboard' });
      }
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

// Admin routes (no auth required for login)
const adminLoginRoute = createRoute({
  path: 'admin/login',
  getParentRoute: () => rootRoute,
  component: AdminLogin,
  beforeLoad: ({ context }: { context: RouterContext }) => {
    // If user is already authenticated as admin, redirect to admin dashboard
    if (context.auth?.isAuthenticated === true && context.auth?.user?.role === 'admin') {
      throw redirect({ to: '/admin/dashboard' });
    }
  },
});

// Protected route layout
const protectedRoute = createRoute({
  id: 'protected',
  getParentRoute: () => rootRoute,
  component: ({ pendingAuth }: { pendingAuth?: boolean }) => {
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
    
    // Prevent admin users from accessing user routes
    if (context.auth?.user?.role === 'admin') {
      throw redirect({ to: '/admin/dashboard' });
    }
    
    return { pendingAuth: false };
  },
});

// Admin protected route layout
const adminProtectedRoute = createRoute({
  id: 'admin-protected',
  getParentRoute: () => rootRoute,
  component: ({ pendingAuth }: { pendingAuth?: boolean }) => {
    if (pendingAuth) {
      return <AuthCheckingLoader />;
    }
    return <Outlet />;
  },
  beforeLoad: ({ context }: { context: RouterContext }) => {
    // Check if user is admin
    if (context.auth?.isAuthenticated === false && context.auth?.isLoading === false) {
      throw redirect({ to: '/admin/login' });
    }
    
    // If we're still loading auth state, we pass a flag to show a loader
    if (context.auth?.isLoading === true) {
      return { pendingAuth: true };
    }
    
    // Check if user is admin (role: admin)
    if (context.auth?.user?.role !== 'admin') {
      throw redirect({ to: '/admin/login' });
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
      // Check if user is admin and redirect accordingly
      if (context.auth?.user?.role === 'admin') {
        throw redirect({ to: '/admin/dashboard' });
      } else {
        throw redirect({ to: '/dashboard' });
      }
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

// Vocal AI Assistant page inside protected layout
const vocalChatRoute = createRoute({
  path: 'vocal-chat',
  getParentRoute: () => protectedRoute,
  component: VocalChatUI,
});

const ProfileRoute = createRoute({
  path: 'profile',
  getParentRoute: () => protectedRoute,
  component: ProfilePage,
});

const SettingsRoute = createRoute({
  path: 'settings',
  getParentRoute: () => protectedRoute,
  component: SettingsPage,
});

// Admin dashboard route
const adminDashboardRoute = createRoute({
  path: 'admin/dashboard',
  getParentRoute: () => adminProtectedRoute,
  component: AdminDashboard,
});

// Admin user detail route
const adminUserDetailRoute = createRoute({
  path: 'admin/users/$userId',
  getParentRoute: () => adminProtectedRoute,
  component: UserDetail,
});

// Admin SipConfigManagement route
const adminSipConfigManagementRoute = createRoute({
  path: 'admin/sip-config-management',
  getParentRoute: () => adminProtectedRoute,
  component: SipConfigManagement,
});

// Not found route
const notFoundRoute = createRoute({
  path: '*',
  getParentRoute: () => rootRoute,
  component: NotFound,
});

// Router definition
export const router = createRouter({
  basepath: '/',
  routeTree: rootRoute.addChildren([
    indexRoute,
    authRoute.addChildren([loginRoute, registerRoute]),
    protectedRoute.addChildren([dashboardRoute, callRoute, vocalChatRoute, ProfileRoute, SettingsRoute]),
    adminLoginRoute,
    adminProtectedRoute.addChildren([adminDashboardRoute, adminUserDetailRoute, adminSipConfigManagementRoute]),
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