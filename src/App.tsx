import { RouterProvider } from '@tanstack/react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { router } from './components/layout/router';

const App = () => {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    const storedTheme = localStorage.getItem("itcallinfo-theme");
    if (storedTheme) {
      setTheme(storedTheme as "light" | "dark");
    }
  }, [setTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
