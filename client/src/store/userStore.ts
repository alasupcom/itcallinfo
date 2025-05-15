import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queriesKeys } from '@/hooks/api/queriesKeys';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  status: string;
  phoneNumber?: string;
  isVerified: boolean;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
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
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({ user: state.user }), // only persist user data, not loading or error states
    }
  )
);

// React Query hooks that work with the Zustand store
export function useCurrentUser() {
  const queryClient = useQueryClient();
  const setUser = useUserStore(state => state.setUser);
  const currentUser = useUserStore(state => state.user);
  
  // Query to fetch user data and sync with Zustand
  const userQuery = useQuery({
    queryKey: [queriesKeys.USER],
    queryFn: async () => {
      try {
        const res = await fetch('/api/user', {
          credentials: 'include',
        });
        const user = await res.json();
        queryClient.setQueryData([queriesKeys.USER], user);
        if (!res.ok) {
          if (res.status === 401) {
            setUser(null);
            return null;
          }
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        setUser(user);
        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    // Prevent refetching if we already have user data in Zustand store
    initialData: currentUser || undefined,
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    refetch: userQuery.refetch,
  };
}