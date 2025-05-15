import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/api/useAuth';
import { useToast } from '@/hooks/useToast';
import { useUserStore } from '@/store/userStore';
import { useNavigate } from '@tanstack/react-router';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {setUser} = useUserStore();
  const { mutateAsync: doLogout, isPending: isLogoutLoading } = useLogout({
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setUser(null);
      navigate({ to: '/auth/login' });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "Please try again!",
      });
    }
  });
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <p className="text-lg mb-4">
            You don't have permission to access this resource.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            If you believe this is an error, please contact your administrator.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate({ to: '/dashboard' })}
              variant="outline"
            >
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={() => doLogout()}
              disabled={isLogoutLoading}
              variant="destructive"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;