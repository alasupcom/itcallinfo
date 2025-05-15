import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import LoginForm from "@/components/auth/LoginForm";
import { useUserStore } from "@/store/userStore";

export default function Login() {
  const navigate = useNavigate();
  const { user, isLoading } = useUserStore();

  useEffect(() => {
    if (user && !isLoading) {
      navigate( { to : '/'} );
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mb-8 text-center">
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">ITCallInfo</h1>
      </div>
      <LoginForm />
    </div>
  );
}
