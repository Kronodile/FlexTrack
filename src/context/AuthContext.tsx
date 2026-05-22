import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
// Resolve web client id: prefer env var, otherwise read from google-services.json
let webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
if (!webClientId) {
    try {
        // Load the downloaded google-services.json placed at repo root or android/app
        // Try root first, then android/app
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const rootConfig = require('../../google-services.json');
        const clients = rootConfig.client || [];
        if (clients.length > 0) {
            const oauthClients = clients[0].oauth_client || [];
            const webClient = oauthClients.find((c: any) => c.client_type === 3);
            if (webClient && webClient.client_id) webClientId = webClient.client_id;
        }
    } catch (e) {
        try {
            // Fallback to android/app version
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const appConfig = require('../../android/app/google-services.json');
            const clients = appConfig.client || [];
            if (clients.length > 0) {
                const oauthClients = clients[0].oauth_client || [];
                const webClient = oauthClients.find((c: any) => c.client_type === 3);
                if (webClient && webClient.client_id) webClientId = webClient.client_id;
            }
        } catch (_) {
            // ignore - webClientId will stay empty
        }
    }
}

GoogleSignin.configure({
    webClientId: webClientId || '',
    offlineAccess: true,
});

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signIn = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(FIREBASE_AUTH, email, pass);
    };

    const signUp = async (email: string, pass: string) => {
        await createUserWithEmailAndPassword(FIREBASE_AUTH, email, pass);
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(FIREBASE_AUTH);
            // Sign out from Google as well
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore if not signed in with Google
            }
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const signInWithGoogle = async () => {
        try {
            // Check if device supports Google Play Services
            await GoogleSignin.hasPlayServices();

            // Get user info from Google
            const userInfo = await GoogleSignin.signIn();
            console.log('GoogleSignin.signIn() userInfo:', userInfo);

            // Try to extract idToken from common locations
            let idToken: string | undefined = (userInfo && ((userInfo as any).idToken || (userInfo as any).data?.idToken)) || undefined;

            // Fallback: ask the native module for tokens
            if (!idToken) {
                try {
                    const tokens = await GoogleSignin.getTokens();
                    console.log('GoogleSignin.getTokens() returned:', tokens);
                    idToken = tokens?.idToken;
                } catch (e) {
                    console.warn('GoogleSignin.getTokens() failed:', e);
                }
            }

            if (!idToken) {
                console.error('No idToken returned by Google Sign-In. userInfo:', userInfo);
                // Match Firebase error shape for easier debugging upstream
                const err: any = new Error('No idToken returned from Google Sign-In');
                err.code = 'auth/argument-error';
                throw err;
            }

            // Create Firebase credential with the Google ID token
            const googleCredential = GoogleAuthProvider.credential(idToken);

            // Sign in to Firebase with the credential
            await signInWithCredential(FIREBASE_AUTH, googleCredential);
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(FIREBASE_AUTH, email);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};
