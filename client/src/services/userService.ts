import { User } from "@/types/api/auth";
import { UserAxiosClient } from "./api/userApi";

  
  export const fetchUser = (userApi: UserAxiosClient) => {
    return userApi.fetchUser();
  };
  
  export const updateUser = (userApi: UserAxiosClient, data: Partial<User>) => {
    return userApi.updateUser(data);
  };
  