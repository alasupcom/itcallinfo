import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
  console.log(firebaseConfig);
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return {
      success: false,
      error,
    };
  }
};

// Sign in with Facebook
export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    console.error("Error signing in with Facebook:", error);
    return {
      success: false,
      error,
    };
  }
};

// Redirect version (for mobile)
export const signInWithGoogleRedirect = () => {
  signInWithRedirect(auth, googleProvider);
};

export const signInWithFacebookRedirect = () => {
  signInWithRedirect(auth, facebookProvider);
};

// Handle redirect result
export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return {
        success: true,
        user: result.user,
      };
    }
    return { success: false };
  } catch (error) {
    console.error("Error handling redirect:", error);
    return {
      success: false,
      error,
    };
  }
};

export { auth };