import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { onRequest } from "firebase-functions/v2/https";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { applySecurityMiddleware } from "./_core/security";

/**
 * Public HTTP entry point. Authentication and role checks are enforced inside
 * tRPC from verified Firebase ID tokens; no financial or admin data is exposed
 * directly by Firestore rules.
 */
const app = express();
applySecurityMiddleware(app);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

/**
 * Bound to Europe for short latency to Firestore in Frankfurt. Conservative
 * concurrency and scaling limits provide a second line of cost control beyond
 * the Google Cloud spend cap configured for this service.
 */
export const api = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
    minInstances: 0,
    maxInstances: 2,
    concurrency: 20,
    invoker: "public",
    serviceAccount: "djawdi-api@gestion-djawdi.iam.gserviceaccount.com",
  },
  app
);
