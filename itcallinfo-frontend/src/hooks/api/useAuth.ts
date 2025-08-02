import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queriesKeys } from './queriesKeys';
import { useUserStore } from '@/store/userStore';
import { useSipStore } from '@/store/sipStore';
import { LoginRequest, OtpVerificationRequest, RegisterRequest } from '@/types/api/auth';
import { signIn, signOut, signUp, verifyOtp } from '@/services/authService';
import { AuthAxiosClient } from '@/services/api/authApi';
import { QueryOptions } from '@/types/api/shared.type';
import { signInWithFacebook, signInWithGoogle } from '@/services/firebase';
import { User } from 'firebase/auth';
import { request } from '@/services/axios';
import { AxiosResponse } from 'axios';

export const useLogout = ({ enabled, onSuccess, onError, onSettled }: QueryOptions) => {
  const { setUser, setLoading, setError, cleanUser } = useUserStore();
  const { cleanup: cleanupSip } = useSipStore();
  const authApi = new AuthAxiosClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      setError(null);
      
      // Clean up SIP state first
      try {
        cleanupSip();
      } catch (error) {
        console.warn('Error cleaning up SIP state:', error);
      }
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear query cache
      queryClient.clear();
      
      return signOut(authApi);
    },
    onSuccess: () => {
      // Clean user store
      cleanUser();
      setUser(null);
      
      // Clear query data
      queryClient.setQueryData([queriesKeys.USER], null);
      
      onSuccess?.();
      setLoading(false);
    },
    onError: (error: any) => {
      setError("Logout failed");
      console.error('Error logging out:', error);
      onError?.(error);
      setLoading(false);
    },
    onSettled: () => {
      setLoading(false);
    }
  });
};


export const useLogin = ({ enabled, onSuccess, onError }: QueryOptions) => {
  const { setUser, setLoading, setError } = useUserStore();
  const authApi = new AuthAxiosClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: LoginRequest) => {
      setLoading(true);
      setError(null);
      return signIn(authApi, variables);
    },
    onSuccess: (data: any) => {
      const user = data.data?.user;
      setUser(user);
      queryClient.setQueryData([queriesKeys.USER], user);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      setError("Login failed");
      console.error('Error logging in:', error);
      setUser(null);
      onError?.(error);
    },
    onSettled: () => {
      setLoading(false);
    }
  });
};

export const useSingUp = ({ enabled, onSuccess, onError }: QueryOptions) => {
  const setUser = useUserStore(state => state.setUser);
  const authApi = new AuthAxiosClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: RegisterRequest) => signUp(authApi, variables),
    onSuccess: () => {
      // queryClient.setQueryData([queriesKeys.USER], null);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error logging in:', error);
      onError?.(error);
    },
  });
};

export const useVerifyOtp = ({ enabled, onSuccess, onError }: QueryOptions) => {
  const setUser = useUserStore(state => state.setUser);
  const authApi = new AuthAxiosClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: OtpVerificationRequest) => verifyOtp(authApi, variables),
    onSuccess: (data: any) => {
      const user = data.data?.user;
      setUser(user);

      queryClient.setQueryData([queriesKeys.USER], user);
      onSuccess?.(data);;
    },
    onError: (error: any) => {
      console.error('Error logging in:', error);
      onError?.(error);
    },
  });
};

// Helper function for processing Firebase users
export const processFirebaseUser = async (firebaseUser: User) => {
  let error: string = '';
  let userData: any = {};
  try {
    // Get Firebase user details
    const { uid, displayName, email, phoneNumber, photoURL } = firebaseUser;

    if (!email) {
      error = 'Email is required for authentication';
      return { error, userData };
    }

    // Try to login or register with Firebase credentials
    const res: AxiosResponse<any> = await request({
      url: '/api/auth/firebase',
      method: 'post'
    }, {
      firebaseUid: uid,
      email,
      fullName: displayName || undefined,
      phoneNumber: phoneNumber || undefined,
      avatarUrl: photoURL || undefined
    });

    const data = await res.data;

    if (data.user) {
      userData = data.user;
    } else {
      error = data.message || 'Failed to authenticate with Firebase';
      return { error, userData };
    }
    return {error, userData};
  } catch (error) {
    error = error instanceof Error ? error.message : 'Failed to process Firebase authentication';
    return {error, userData};
  }
};

export const useLoginWithGoogle = ({ onSuccess, onError, onSettled }: QueryOptions) => {
  const { setLoading, setError } = useUserStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      //   setLoading(true);
      setError(null);
      try {
        const result = await signInWithGoogle();

        if (result.success && result.user) {
          const {error, userData} = await processFirebaseUser(result.user);
          return { success: !error, error, user: userData };
        } else {
          throw new Error('Failed to login with Google');
        }
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData([queriesKeys.USER], data.user);
        onSuccess?.(data);
      } else {
        throw new Error('Failed to process user data');
      }
      setLoading(false);
    },
    onError: (error: any) => {
      setError(error instanceof Error ? error.message : 'Failed to login with Google');
      console.error('Error logging in with Google:', error);
      onError?.(error);
      setLoading(false);
    },
    onSettled: () => {
      setLoading(false);
    }
  });
};

export const useLoginWithFacebook = ({ onSuccess, onError }: QueryOptions) => {
  const { setLoading, setError } = useUserStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      //   setLoading(true);
      setError(null);
      try {
        const result = await signInWithFacebook();

        if (result.success && result.user) {
          const {error, userData} = await processFirebaseUser(result.user);
          return { success: !error, error, user: userData };
        } else {
          throw new Error('Failed to login with Facebook');
        }
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData([queriesKeys.USER], data.user);
        onSuccess?.(data);
      } else {
        throw new Error('Failed to process user data');
      }
      setLoading(false);
    },
    onError: (error: any) => {
      setError(error instanceof Error ? error.message : 'Failed to login with Facebook');
      console.error('Error logging in with Facebook:', error);
      onError?.(error);
      setLoading(false);
    },
    onSettled: () => {
      setLoading(false);
    }
  });
};