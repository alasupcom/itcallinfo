import { FirebaseAuthData, LoginRequest, OtpVerificationRequest, RegisterRequest } from '@/types/api/auth';
import { request } from '../axios';

export class AuthAxiosClient {
  private readonly endpoint = '/api/auth';

  signIn(data: LoginRequest) {
    console.log(data, "LoginREsuest");
    return request<LoginRequest, any>({
      url: `${this.endpoint}/login`,
      method: 'post',
    }, data);
  }

  signUp(data: RegisterRequest) {
    return request<RegisterRequest, any>({
      url: `${this.endpoint}/register`,
      method: 'post',
    }, data);
  }

  verifyOtp(data: OtpVerificationRequest) {
    return request<OtpVerificationRequest, any>({
      url: `${this.endpoint}/verify-otp`,
      method: 'post',
    }, data);
  }

  signOut() {
    return request<undefined, any>({
      url: `${this.endpoint}/logout`,
      method: 'post',
    });
  }

  firebaseAuth(data: FirebaseAuthData) {
    return request<FirebaseAuthData, any>({
      url: `${this.endpoint}/firebase`,
      method: 'post',
    }, data);
  }
}
