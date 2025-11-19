import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getIdToken
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  authDomain: "ai-story-maker.firebaseapp.com",
  projectId: "ai-story-maker",
  storageBucket: "ai-story-maker.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase and Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();

// Configure Google OAuth scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Google OAuth Service
class GoogleAuthService {
  
  /**
   * Sign in with Google OAuth
   * @returns Promise with user credentials and ID token
   */
  static async signInWithGoogle(): Promise<{ 
    user: FirebaseUser; 
    idToken: string; 
  }> {
    try {
      console.log('Initiating Google OAuth sign-in...');
      
      // Sign in with Google using popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the ID token
      const idToken = await getIdToken(result.user, true);
      
      console.log('Google OAuth sign-in successful:', result.user.email);
      
      return {
        user: result.user,
        idToken
      };
      
    } catch (error: any) {
      console.error('Google OAuth sign-in failed:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups and try again.');
      } else {
        throw new Error(error.message || 'Google sign-in failed');
      }
    }
  }
  
  /**
   * Sign out from Google
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      console.log('Google OAuth sign-out successful');
    } catch (error: any) {
      console.error('Google OAuth sign-out failed:', error);
      throw new Error(error.message || 'Sign-out failed');
    }
  }
  
  /**
   * Get current Firebase user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
  
  /**
   * Get ID token for current user
   */
  static async getCurrentIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await getIdToken(user, true);
    }
    return null;
  }
  
  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChanged(
    callback: (user: FirebaseUser | null) => void
  ): () => void {
    return onAuthStateChanged(auth, callback);
  }
  
  /**
   * Check if user is signed in
   */
  static isSignedIn(): boolean {
    return auth.currentUser !== null;
  }
  
  /**
   * Get user profile data from Firebase
   */
  static getUserProfile(user: FirebaseUser) {
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      picture: user.photoURL,
      emailVerified: user.emailVerified,
      provider: 'google'
    };
  }
}

export default GoogleAuthService;
export { GoogleAuthService };