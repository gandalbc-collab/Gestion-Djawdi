/**
 * Singleton module that holds the current Firebase ID token.
 * Both the tRPC client (main.tsx) and useAuth read/write through this
 * module so there is a single source of truth during session changes.
 */

let _currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _currentToken = token;
}

export function getAuthToken(): string | null {
  return _currentToken;
}
