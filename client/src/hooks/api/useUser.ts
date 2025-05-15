
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

import { queriesKeys } from './queriesKeys';
import { useUserStore } from '@/store/userStore';
import { User } from '@/types/api/auth';
import { QueryOptions } from '@/types/api/shared.type';
import { updateUser } from '@/services/userService';
import { UserAxiosClient } from '@/services/api/userApi';

  export const fetchUser = ({enabled}: QueryOptions) => {
    const userApi = new UserAxiosClient();
    
    return useQuery({
      queryKey: [queriesKeys.USER],
      queryFn: async () => {
        const response = await userApi.fetchUser();
        return response.data;
      },
      enabled,
    });
  };

export const useUpdateUser = ({ enabled, onSuccess, onError }: QueryOptions) => {
    const setUser = useUserStore(state => state.setUser);
    const userApi = new UserAxiosClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: Partial<User>) => updateUser(userApi, variables),
        onSuccess: (data: any) => {
            const user = data.data?.user;
            setUser(user);

            queryClient.setQueryData([queriesKeys.USER], null);
            onSuccess?.();
        },
        onError: (error: any) => {
            console.error('Error logging in:', error);
            onError?.(error);
        },
    });
};


