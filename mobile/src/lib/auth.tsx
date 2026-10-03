import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from './supabase';

// Required by expo-web-browser when the OAuth flow completes on web.
// No-op on iOS/Android — safe to call unconditionally.
WebBrowser.maybeCompleteAuthSession();

/** Where Supabase sends the user back after signing in. */
const redirectTo = makeRedirectUri();

/**
 * URLs we already turned into a session. The same redirect can arrive twice
 * (once through openAuthSessionAsync, once through the Linking listener) —
 * processing it once avoids a redundant setSession round trip.
 */
const handledUrls = new Set<string>();

/**
 * Turns an OAuth/email-confirmation redirect URL into a Supabase session.
 *
 * Handles both flows Supabase uses:
 * - implicit: tokens arrive as #access_token=...&refresh_token=...
 * - PKCE: a single ?code=... that must be exchanged
 *
 * Follows the example in Supabase's native mobile deep linking docs.
 */
async function createSessionFromUrl(url: string): Promise<void> {
  if (handledUrls.has(url)) return;
  handledUrls.add(url);

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(`Sign-in failed: ${errorCode}`);
  }

  const { access_token, refresh_token, code } = params;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    if (error) throw error;
    return;
  }

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  }
}

interface AuthContextValue {
  /** Current session, or null when signed out. */
  session: Session | null;
  user: User | null;
  /** True until the initial getSession() resolves. */
  loading: boolean;
  /** Set when a deep-link sign-in attempt failed, for display in the UI. */
  authError: string | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  // Guards the "wait for deep link" state so two clicks don't open two browsers.
  const oauthInFlight = useRef(false);

  // Keep the context in sync with Supabase (token refresh, sign in/out).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Session arriving from a deep link (Google OAuth returning to the app, or
  // the user tapping the email-confirmation link on this device).
  const linkingUrl = Linking.useLinkingURL();

  useEffect(() => {
    if (!linkingUrl) return;
    let cancelled = false;

    createSessionFromUrl(linkingUrl)
      .then(() => {
        if (!cancelled) setAuthError(null);
      })
      .catch((error) => {
        console.error('Could not complete sign-in from link:', error);
        if (!cancelled) {
          setAuthError(
            error instanceof Error ? error.message : 'Could not complete sign-in'
          );
        }
      })
      .finally(() => {
        oauthInFlight.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [linkingUrl]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  /**
   * Returns true when the account was created and Supabase signed the user in
   * immediately; false means email confirmation is required first (the caller
   * shows a "check your inbox" message).
   */
  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Lets Supabase link back into the app after the user confirms by email.
      options: { emailRedirectTo: makeRedirectUri({ path: 'auth/callback' }) },
    });
    if (error) throw error;
    return data.session !== null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    if (oauthInFlight.current) return;
    oauthInFlight.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(
        data.url ?? '',
        redirectTo
      );

      // 'success' = the browser redirected back into the app.
      // 'cancel'/'dismiss' = the user closed it; not an error.
      if (result.type === 'success') {
        await createSessionFromUrl(result.url);
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setAuthError(
        error instanceof Error ? error.message : 'Google sign-in failed'
      );
      throw error;
    } finally {
      oauthInFlight.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      authError,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [
      session,
      loading,
      authError,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
