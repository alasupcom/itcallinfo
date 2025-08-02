import { FirebaseAuthData, LoginRequest, OtpVerificationRequest, RegisterRequest } from "@/types/api/auth";
import { AuthAxiosClient } from "./api/authApi";

  
  export const signIn = (authApi: AuthAxiosClient, data: LoginRequest) => {
    return authApi.signIn(data);
  };
  
  export const signOut = (authApi: AuthAxiosClient) => {
    return authApi.signOut();
  };
  
  export const signUp = (authApi: AuthAxiosClient, data: RegisterRequest) => {
    return authApi.signUp(data);
  };
  
  export const verifyOtp = (authApi: AuthAxiosClient, data: OtpVerificationRequest) => {
    return authApi.verifyOtp(data);
  };
  
  export const firebaseAuth = (authApi: AuthAxiosClient, data: FirebaseAuthData) => {
    return authApi.firebaseAuth(data);
  };

  