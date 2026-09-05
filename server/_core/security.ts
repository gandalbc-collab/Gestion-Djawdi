import type { Express, Request, Response, NextFunction } from "express";

/**
 * Baseline HTTP protections for API responses and locally served static files.
 * The same policy is used by the Firebase-hosted production application.
 */
export function applySecurityMiddleware(app: Express): void {
  app.disable("x-powered-by");

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com; upgrade-insecure-requests"
      );
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
  });
}
