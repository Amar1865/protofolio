import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { apiClient, AuthUser, registerTokenGetter } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginWithCredentials: (
    email: string,
    password: string,
    portal?: 'investor' | 'admin'
  ) => Promise<AuthUser>;
  registerInvestor: (data: {
    fullName: string;
    email: string;
    password: string;
    currency: string;
    riskProfile: string;
  }) => Promise<AuthUser>;
  loginWithGoogle: () => Promise<AuthUser>;
  refreshProfile: () => Promise<void>;
  updateUserState: (nextUser: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);

  useEffect(() => {
    registerTokenGetter(async () => {
      if (firebaseUserRef.current) {
        return await firebaseUserRef.current.getIdToken();
      }
      return null;
    });
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const bootstrapSession = async () => {
      // First check whether a valid HTTP-only cookie session exists on the server.
      try {
        const { user: fetchedUser } = await apiClient.getCurrentUser();
        if (active) {
          setUser(fetchedUser);
          setLoading(false);
        }
        return;
      } catch {
        // No active cookie session; fall back to Firebase Auth observer if active.
      }

      if (!active) return;

      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        firebaseUserRef.current = fbUser;
        if (!active) return;

        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            const { user: syncedUser } = await apiClient.syncFirebaseSession(idToken);
            if (active) setUser(syncedUser);
          } catch {
            if (active) setUser(null);
          }
        } else {
          setUser(null);
        }

        if (active) setLoading(false);
      });
    };

    bootstrapSession();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string, portal?: 'investor' | 'admin') => {
      const { user: loggedInUser } = await apiClient.login({
        email,
        password,
        portal,
      });
      setUser(loggedInUser);
      return loggedInUser;
    },
    []
  );

  const registerInvestor = useCallback(
    async (data: {
      fullName: string;
      email: string;
      password: string;
      currency: string;
      riskProfile: string;
    }) => {
      const { user: registeredUser } = await apiClient.registerInvestor(data);
      setUser(registeredUser);
      return registeredUser;
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    firebaseUserRef.current = credential.user;
    const idToken = await credential.user.getIdToken();
    const { user: syncedUser } = await apiClient.syncFirebaseSession(idToken);
    setUser(syncedUser);
    return syncedUser;
  }, []);

  const refreshProfile = useCallback(async () => {
    const { user: freshUser } = await apiClient.getCurrentUser();
    setUser(freshUser);
  }, []);

  const updateUserState = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // Proceed with client sign-out even if the network request fails.
    }
    if (firebaseUserRef.current || auth.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // Ignore Firebase sign-out error if not signed in via Firebase
      }
      firebaseUserRef.current = null;
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithCredentials,
        registerInvestor,
        loginWithGoogle,
        refreshProfile,
        updateUserState,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
