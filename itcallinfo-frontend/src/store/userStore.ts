import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queriesKeys } from '@/hooks/api/queriesKeys';
import { axiosClient } from '@/services/axios';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  status: string;
  role: string; // "admin" or "user"
  phoneNumber?: string;
  isVerified: boolean;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  cleanUser: () => void;
  // loginWithGoogle: () => Promise<boolean>;
  // loginWithFacebook: () => Promise<boolean>;
  // processFirebaseUser: (firebaseUser: FirebaseUser) => Promise<boolean>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),
      cleanUser: () => set({
        user: null,
        isAuthenticated: false
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

export function useCurrentUser() {
  const queryClient = useQueryClient();
  const { setUser, cleanUser, isAuthenticated } = useUserStore();
  const currentUser = useUserStore(state => state.user);

  const userQuery = useQuery({
    queryKey: [queriesKeys.USER],
    queryFn: async () => {
      try {
        const res = await axiosClient.get('/api/user');
        const userData = res.data;
        queryClient.setQueryData([queriesKeys.USER], userData);

        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Error fetching user:', error);
        cleanUser();
        return null;
      }
    },

    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
    initialData: currentUser || undefined,
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    refetch: userQuery.refetch,
    isAuthenticated
  };
}