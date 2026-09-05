import { trpc } from "@/lib/trpc";
import { setAuthToken } from "@/lib/authToken";
import { firebaseAuth } from "@/lib/firebase";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Track the Firebase ID token — sent as Bearer to tRPC.
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // sessionLoading stays true until getSession() has resolved (prevents premature "not authenticated" flash)
  const [sessionLoading, setSessionLoading] = useState(true);

  // Listen to Firebase auth state changes (login, logout and token refresh).
  useEffect(() => {
    if (!firebaseAuth) {
      setSessionLoading(false);
      return;
    }
    const unsubscribe = onIdTokenChanged(firebaseAuth, async user => {
      const token = user ? await user.getIdToken() : null;
      setAuthToken(token);
      setAccessToken(token);
      setSessionLoading(false);
      utils.auth.me.invalidate();
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(accessToken),
  });

  const logout = useCallback(async () => {
    if (firebaseAuth) await signOut(firebaseAuth);
    setAuthToken(null);
    setAccessToken(null);
    setSessionLoading(false);
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
    navigate("/");
  }, [utils, navigate]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    // loading stays true until Firebase has restored its persisted session and tRPC has checked it.
    loading: sessionLoading || (Boolean(accessToken) && meQuery.isLoading),
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    accessToken,
  }), [meQuery.data, meQuery.error, meQuery.isLoading, accessToken, sessionLoading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading) return;
    if (sessionLoading) return;
    if (accessToken && state.user) return;
    if (typeof window === "undefined") return;
    const target = redirectPath ?? "/";
    if (window.location.pathname === target) return;
    navigate(target);
  }, [redirectOnUnauthenticated, redirectPath, meQuery.isLoading, accessToken, state.user, navigate, sessionLoading]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
