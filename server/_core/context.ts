import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getFirebaseAdminAuth } from "./firebaseAdmin";
import type { FirebaseUser } from "../firebaseDb";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: FirebaseUser | null;
};

export function hasVerifiedEmail(decoded: { email?: string; email_verified?: boolean }): boolean {
  return typeof decoded.email === "string" && decoded.email.length > 0 && decoded.email_verified === true;
}

/**
 * Verifies Firebase ID tokens server-side. The signed token is always supplied
 * through the Authorization bearer header; the browser is never trusted with a
 * claimed user id or role.
 */
async function getFirebaseUser(req: CreateExpressContextOptions["req"]): Promise<FirebaseUser | null> {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(authHeader.slice(7), true);
    if (!hasVerifiedEmail(decoded)) return null;
    const email = decoded.email ?? null;
    const name = decoded.name ?? email?.split("@")[0] ?? "Utilisateur";
    const loginMethod = typeof decoded.firebase?.sign_in_provider === "string" ? decoded.firebase.sign_in_provider : "email";

    await db.upsertUser({
      openId: decoded.uid,
      name,
      email,
      loginMethod,
      lastSignedIn: new Date(),
    });

    const user = await db.getUserByOpenId(decoded.uid);
    if (!user || user.isBlocked) return null;
    return user;
  } catch (error) {
    console.warn("[Auth] Firebase token verification failed:", String(error));
    return null;
  }
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const user = await getFirebaseUser(opts.req).catch(() => null);
  return { req: opts.req, res: opts.res, user };
}
