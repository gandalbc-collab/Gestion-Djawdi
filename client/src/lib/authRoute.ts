export function getProtectedRouteRedirect(loading: boolean, isAuthenticated: boolean): "/login" | null {
  return !loading && !isAuthenticated ? "/login" : null;
}
