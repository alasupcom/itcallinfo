import { RouterProvider } from '@tanstack/react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/queryClient';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { router } from '@/components/layout/router';
import { useCurrentUser, useUserStore } from '@/store/userStore';
import { Loader2 } from 'lucide-react';
import { useSipStore } from './store/sipStore';

const App = () => {
  const { setTheme } = useThemeStore();
  // const { user, isLoading } = useUserStore();
  const storedUser = useUserStore(state => state.user);
  const { refetch, isLoading: isCurrentUserLoading, user: fetchedUser } = useCurrentUser();
  const { fetchConfig } = useSipStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {

    const storedTheme = localStorage.getItem("itcallinfo-theme");
    if (storedTheme) {
      setTheme(storedTheme as "light" | "dark");
    }
  }, [setTheme]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!storedUser) {
          await refetch();
        }
        await fetchConfig();
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadInitialData();
  }, [refetch, fetchConfig, storedUser]);

  const user = storedUser || fetchedUser;
  const isAuthenticated = !!user;

  // const isAuthenticated = !!user && !isLoading && !isCurrentUserLoading;
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (

    <TooltipProvider>
      <Toaster />
      <RouterProvider
        router={router}
        context={{
          auth: {
            isAuthenticated,
            user,
            isLoading: isCurrentUserLoading
          },
        }}
        // This forces router to refresh when auth changes
        key={user ? user.id : 'unauthenticated'}
      />
    </TooltipProvider>
  );
};

export default App;
