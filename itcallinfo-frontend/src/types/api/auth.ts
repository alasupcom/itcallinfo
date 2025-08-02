export interface AuthContext {
  isAuthenticated: boolean;
  user: { id: string; username: string; role: string } | null;
  isLoading: boolean;
}

export interface RouterContext {
  auth?: AuthContext;
}

export interface LoginRequest {
    username: string; // Can be username or email
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    phoneNumber?: string;
}

export interface OtpVerificationRequest {
    userId: number;
    otp: string;
  }

  export interface FirebaseAuthData {
    firebaseUid: string;
    email: string;
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  }

  export interface User {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    avatarUrl?: string | null;
    status: string;
    role: string; // "admin" or "user"
    phoneNumber?: string;
    isVerified: boolean;
  }