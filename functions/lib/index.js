// ../server/firebaseApi.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { onRequest } from "firebase-functions/v2/https";

// ../server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// ../server/_core/systemRouter.ts
import { z } from "zod";

// ../server/_core/notification.ts
import { TRPCError } from "@trpc/server";

// ../server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// ../server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// ../shared/const.ts
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// ../server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// ../server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// ../server/firebaseDb.ts
import { Timestamp } from "firebase-admin/firestore";

// ../server/_core/firebaseAdmin.ts
import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
function firebaseOptions() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      return { projectId, credential: cert(JSON.parse(serviceAccountJson)) };
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
  }
  return { projectId, credential: applicationDefault() };
}
function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseOptions());
}
function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

// ../server/firebaseDb.ts
var COLLECTIONS = {
  users: "users",
  profiles: "userProfiles",
  categories: "categories",
  revenues: "revenues",
  budgets: "budgets",
  expenses: "expenses",
  scheduledPayments: "scheduledPayments",
  courseCategories: "courseCategories",
  courses: "courses",
  courseProgress: "courseProgress",
  courseLikes: "courseLikes",
  courseRatings: "courseRatings",
  courseComments: "courseComments",
  ads: "ads",
  adminNotifications: "adminNotifications",
  site: "site",
  counters: "counters"
};
var DEFAULT_CATEGORIES = [
  { name: "Logement", icon: "\u{1F3E0}", description: "Loyer, courant, eau, nettoyage" },
  { name: "Abonnements", icon: "\u{1F4F1}", description: "T\xE9l\xE9phone, TV, Internet" },
  { name: "Alimentation", icon: "\u{1F37D}\uFE0F", description: "Courses et repas" },
  { name: "Sant\xE9", icon: "\u{1F48A}", description: "Hygi\xE8ne et soins" },
  { name: "V\xE9hicule", icon: "\u{1F697}", description: "Transport et assurance" },
  { name: "Dettes", icon: "\u{1F4B3}", description: "Remboursements" },
  { name: "\xC9pargne", icon: "\u{1F4B0}", description: "Fond d'urgence" },
  { name: "D\xE9penses pro", icon: "\u{1F4BC}", description: "Obligatoire pour le travail" },
  { name: "Famille", icon: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}", description: "D\xE9penses familiales" },
  { name: "Obligations sociales", icon: "\u{1F91D}", description: "C\xE9r\xE9monies et charit\xE9" },
  { name: "Loisirs", icon: "\u{1F3AE}", description: "Divertissement" },
  { name: "Taxes", icon: "\u{1F4CB}", description: "Imp\xF4ts et frais de service" },
  { name: "Impr\xE9vus", icon: "\u26A1", description: "D\xE9penses surprises" },
  { name: "Exceptionnel", icon: "\u2708\uFE0F", description: "Vacances et sorties" },
  { name: "Investissement", icon: "\u{1F4C8}", description: "Retraite et libert\xE9 financi\xE8re" }
];
function db() {
  return getFirebaseAdminDb();
}
function clean(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== void 0));
}
function normalise(value) {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalise(entry)]));
  return value;
}
function read(snapshot) {
  const data = snapshot.data();
  if (!data) throw new Error("Document Firestore introuvable");
  return normalise(data);
}
async function nextId(collection) {
  const counter = db().collection(COLLECTIONS.counters).doc(collection);
  return db().runTransaction(async (transaction) => {
    const previous = await transaction.get(counter);
    const id = (previous.exists ? Number(previous.data()?.value ?? 0) : 0) + 1;
    transaction.set(counter, { value: id, updatedAt: /* @__PURE__ */ new Date() });
    return id;
  });
}
async function createWithId(collection, data) {
  const id = await nextId(collection);
  const item = { id, ...data };
  await db().collection(collection).doc(String(id)).set(clean(item));
  return item;
}
async function listWhere(collection, field, value) {
  const snapshots = await db().collection(collection).where(field, "==", value).get();
  return snapshots.docs.map((snapshot) => read(snapshot));
}
async function findById(collection, id) {
  const snapshot = await db().collection(collection).doc(String(id)).get();
  return snapshot.exists ? read(snapshot) : null;
}
async function updateById(collection, id, patch) {
  await db().collection(collection).doc(String(id)).update(clean({ ...patch, updatedAt: /* @__PURE__ */ new Date() }));
}
async function deleteById(collection, id) {
  await db().collection(collection).doc(String(id)).delete();
}
async function userById(id) {
  const rows = await listWhere(COLLECTIONS.users, "id", id);
  return rows[0] ?? null;
}
async function upsertUser(user) {
  const reference = db().collection(COLLECTIONS.users).doc(user.openId);
  const current = await reference.get();
  const now = /* @__PURE__ */ new Date();
  if (!current.exists) {
    const id = await nextId(COLLECTIONS.users);
    await reference.set(clean({
      id,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? "email",
      role: "user",
      isBlocked: false,
      passwordResetRequestedAt: null,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now
    }));
    return;
  }
  await reference.update(clean({
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    lastSignedIn: user.lastSignedIn ?? now,
    updatedAt: now
  }));
}
async function getUserByOpenId(openId) {
  const snapshot = await db().collection(COLLECTIONS.users).doc(openId).get();
  return snapshot.exists ? read(snapshot) : void 0;
}
async function getOrCreateProfile(userId) {
  const reference = db().collection(COLLECTIONS.profiles).doc(String(userId));
  const snapshot = await reference.get();
  if (snapshot.exists) return read(snapshot);
  const now = /* @__PURE__ */ new Date();
  const profile = { id: userId, userId, fullName: null, currency: "GNF", phone: null, city: null, profileEmail: null, createdAt: now, updatedAt: now };
  await reference.set(profile);
  return profile;
}
async function updateProfile(userId, data) {
  await getOrCreateProfile(userId);
  await db().collection(COLLECTIONS.profiles).doc(String(userId)).update(clean({ ...data, updatedAt: /* @__PURE__ */ new Date() }));
  return getOrCreateProfile(userId);
}
async function completeRegistrationProfile(data) {
  const userReference = db().collection(COLLECTIONS.users).doc(data.openId);
  const now = /* @__PURE__ */ new Date();
  await db().runTransaction(async (transaction) => {
    const existingUser = await transaction.get(userReference);
    const profileReference = db().collection(COLLECTIONS.profiles).doc(String(existingUser.exists ? Number(existingUser.data()?.id) : "pending"));
    const existingProfile = existingUser.exists ? await transaction.get(profileReference) : null;
    let userId;
    if (existingUser.exists) {
      userId = Number(existingUser.data()?.id);
      transaction.update(userReference, { name: data.fullName, email: data.email, updatedAt: now });
    } else {
      const counter = db().collection(COLLECTIONS.counters).doc(COLLECTIONS.users);
      const previousCounter = await transaction.get(counter);
      userId = (previousCounter.exists ? Number(previousCounter.data()?.value ?? 0) : 0) + 1;
      transaction.set(counter, { value: userId, updatedAt: now });
      transaction.set(userReference, {
        id: userId,
        openId: data.openId,
        name: data.fullName,
        email: data.email,
        loginMethod: "email",
        role: "user",
        isBlocked: false,
        passwordResetRequestedAt: null,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now
      });
    }
    const finalProfileReference = db().collection(COLLECTIONS.profiles).doc(String(userId));
    transaction.set(finalProfileReference, clean({
      id: userId,
      userId,
      fullName: data.fullName,
      currency: existingProfile?.exists ? existingProfile.data()?.currency ?? "GNF" : "GNF",
      phone: data.phone,
      city: data.city,
      profileEmail: data.email,
      createdAt: existingProfile?.exists ? existingProfile.data()?.createdAt ?? now : now,
      updatedAt: now
    }), { merge: true });
  });
}
async function ensureDefaultCategories(userId) {
  const existing = await listWhere(COLLECTIONS.categories, "userId", userId);
  if (existing.length) return existing.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const category of DEFAULT_CATEGORIES) await createCategory(userId, { ...category });
  return getCategories(userId);
}
async function getCategories(userId) {
  const rows = await listWhere(COLLECTIONS.categories, "userId", userId);
  return rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
async function createCategory(userId, data) {
  await createWithId(COLLECTIONS.categories, { userId, name: data.name, icon: data.icon ?? "\u{1F4CC}", description: data.description ?? null, isCustom: true, createdAt: /* @__PURE__ */ new Date() });
  return getCategories(userId);
}
async function getRevenues(userId, month) {
  return (await listWhere(COLLECTIONS.revenues, "userId", userId)).filter((item) => item.month === month).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
async function addRevenue(userId, data) {
  await createWithId(COLLECTIONS.revenues, { userId, ...data, createdAt: /* @__PURE__ */ new Date() });
}
async function deleteRevenue(userId, id) {
  const item = await findById(COLLECTIONS.revenues, id);
  if (item?.userId === userId) await deleteById(COLLECTIONS.revenues, id);
}
async function getBudgets(userId, month) {
  return (await listWhere(COLLECTIONS.budgets, "userId", userId)).filter((item) => item.month === month);
}
async function upsertBudget(userId, categoryId, amount, month) {
  const existing = (await getBudgets(userId, month)).find((item) => item.categoryId === categoryId);
  if (existing) return updateById(COLLECTIONS.budgets, existing.id, { amount });
  await createWithId(COLLECTIONS.budgets, { userId, categoryId, amount, month, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
}
async function getExpenses(userId, month) {
  return (await listWhere(COLLECTIONS.expenses, "userId", userId)).filter((item) => item.month === month).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
async function addExpense(userId, data) {
  await createWithId(COLLECTIONS.expenses, { userId, ...data, createdAt: /* @__PURE__ */ new Date() });
}
async function deleteExpense(userId, id) {
  const item = await findById(COLLECTIONS.expenses, id);
  if (item?.userId === userId) await deleteById(COLLECTIONS.expenses, id);
}
async function getCaisseData(userId) {
  const [allRevenues, allExpenses, categories] = await Promise.all([
    listWhere(COLLECTIONS.revenues, "userId", userId),
    listWhere(COLLECTIONS.expenses, "userId", userId),
    getCategories(userId)
  ]);
  const savingId = categories.find((category) => category.name === "\xC9pargne")?.id;
  const cumulativeSurplus = allRevenues.reduce((sum, item) => sum + Number(item.amount), 0) - allExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const cumulativeSavings = allExpenses.filter((item) => item.categoryId === savingId).reduce((sum, item) => sum + Number(item.amount), 0);
  return { cumulativeSurplus, cumulativeSavings };
}
async function getSynthesisData(userId) {
  const [allRevenues, allExpenses, allBudgets] = await Promise.all([
    listWhere(COLLECTIONS.revenues, "userId", userId),
    listWhere(COLLECTIONS.expenses, "userId", userId),
    listWhere(COLLECTIONS.budgets, "userId", userId)
  ]);
  const months = new Set([...allRevenues, ...allExpenses, ...allBudgets].map((item) => item.month));
  return Array.from(months).sort().reverse().map((month) => {
    const revenues = allRevenues.filter((item) => item.month === month).reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = allExpenses.filter((item) => item.month === month).reduce((sum, item) => sum + Number(item.amount), 0);
    const budget = allBudgets.filter((item) => item.month === month).reduce((sum, item) => sum + Number(item.amount), 0);
    return { month, revenues, expenses, budget, variance: budget - expenses };
  });
}
async function getScheduledPayments(userId) {
  return (await listWhere(COLLECTIONS.scheduledPayments, "userId", userId)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
async function createScheduledPayment(userId, data) {
  await createWithId(COLLECTIONS.scheduledPayments, { userId, ...data, isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
  return getScheduledPayments(userId);
}
async function toggleScheduledPayment(userId, id) {
  const item = await findById(COLLECTIONS.scheduledPayments, id);
  if (!item || item.userId !== userId) throw new Error("Not found");
  await updateById(COLLECTIONS.scheduledPayments, id, { isActive: !item.isActive });
}
async function deleteScheduledPayment(userId, id) {
  const item = await findById(COLLECTIONS.scheduledPayments, id);
  if (item?.userId === userId) await deleteById(COLLECTIONS.scheduledPayments, id);
}
async function executeScheduledPayment(userId, id, month) {
  const payment = await findById(COLLECTIONS.scheduledPayments, id);
  if (!payment || payment.userId !== userId) throw new Error("Scheduled payment not found");
  const duplicate = (await getExpenses(userId, month)).find((item) => item.description === `${payment.description} (Programm\xE9)`);
  if (duplicate) throw new Error("DUPLICATE");
  await addExpense(userId, { categoryId: payment.categoryId, amount: payment.amount, description: `${payment.description} (Programm\xE9)`, month });
}
async function getLearningSettings() {
  const reference = db().collection(COLLECTIONS.site).doc("learningSettings");
  const snapshot = await reference.get();
  if (snapshot.exists) return read(snapshot);
  const settings = { id: 1, youtubeChannelUrl: null, showYoutubeButton: true, allowLikes: true, allowRatings: true, allowComments: true, updatedAt: /* @__PURE__ */ new Date() };
  await reference.set(settings);
  return settings;
}
async function updateLearningSettings(data) {
  const reference = db().collection(COLLECTIONS.site).doc("learningSettings");
  await getLearningSettings();
  const { youtubeUrl, ...rest } = data;
  await reference.update(clean({ ...rest, youtubeChannelUrl: rest.youtubeChannelUrl ?? youtubeUrl, updatedAt: /* @__PURE__ */ new Date() }));
}
async function getCourseCategories() {
  const snapshots = await db().collection(COLLECTIONS.courseCategories).get();
  return snapshots.docs.map((snapshot) => read(snapshot)).sort((a, b) => a.sortOrder - b.sortOrder);
}
async function createCourseCategory(data) {
  await createWithId(COLLECTIONS.courseCategories, { name: data.name, icon: data.icon ?? "\u{1F4DA}", color: data.color ?? "emerald", sortOrder: data.sortOrder ?? 0, createdAt: /* @__PURE__ */ new Date() });
}
async function getPublishedCourses() {
  const snapshots = await db().collection(COLLECTIONS.courses).get();
  return snapshots.docs.map((snapshot) => read(snapshot)).filter((course) => course.isPublished).sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
}
async function getAllCourses() {
  const snapshots = await db().collection(COLLECTIONS.courses).get();
  return snapshots.docs.map((snapshot) => read(snapshot)).sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
}
async function getCourseBySlug(slug) {
  const rows = await listWhere(COLLECTIONS.courses, "slug", slug);
  return rows[0] ?? null;
}
async function getCourseById(id) {
  return findById(COLLECTIONS.courses, id);
}
async function createCourse(data) {
  const duplicate = await getCourseBySlug(data.slug);
  if (duplicate) throw new Error("Un cours utilise d\xE9j\xE0 cet identifiant.");
  await createWithId(COLLECTIONS.courses, { ...data, categoryId: data.categoryId ?? null, excerpt: data.excerpt ?? null, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
}
async function updateCourse(id, data) {
  if (data.slug) {
    const duplicate = await getCourseBySlug(data.slug);
    if (duplicate && duplicate.id !== id) throw new Error("Un cours utilise d\xE9j\xE0 cet identifiant.");
  }
  await updateById(COLLECTIONS.courses, id, data);
}
async function deleteCourse(id) {
  await deleteById(COLLECTIONS.courses, id);
}
async function getUserCourseProgress(userId) {
  return listWhere(COLLECTIONS.courseProgress, "userId", userId);
}
async function markCourseComplete(userId, courseId) {
  const existing = (await getUserCourseProgress(userId)).find((item) => item.courseId === courseId);
  if (!existing) await createWithId(COLLECTIONS.courseProgress, { userId, courseId, completedAt: /* @__PURE__ */ new Date() });
}
async function unmarkCourseComplete(userId, courseId) {
  const item = (await getUserCourseProgress(userId)).find((progress) => progress.courseId === courseId);
  if (item) await deleteById(COLLECTIONS.courseProgress, item.id);
}
async function toggleCourseLike(userId, courseId) {
  const existing = (await listWhere(COLLECTIONS.courseLikes, "userId", userId)).find((item) => item.courseId === courseId);
  if (existing) {
    await deleteById(COLLECTIONS.courseLikes, existing.id);
    return false;
  }
  await createWithId(COLLECTIONS.courseLikes, { userId, courseId, createdAt: /* @__PURE__ */ new Date() });
  return true;
}
async function getCourseLikesCount(courseId) {
  return (await listWhere(COLLECTIONS.courseLikes, "courseId", courseId)).length;
}
async function getUserLikedCourses(userId) {
  return listWhere(COLLECTIONS.courseLikes, "userId", userId);
}
async function upsertCourseRating(userId, courseId, rating) {
  const existing = (await listWhere(COLLECTIONS.courseRatings, "userId", userId)).find((item) => item.courseId === courseId);
  if (existing) return updateById(COLLECTIONS.courseRatings, existing.id, { rating });
  await createWithId(COLLECTIONS.courseRatings, { userId, courseId, rating, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
}
async function getCourseAverageRating(courseId) {
  const ratings = await listWhere(COLLECTIONS.courseRatings, "courseId", courseId);
  if (!ratings.length) return null;
  return { average: Math.round(ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length * 10) / 10, count: ratings.length };
}
async function getUserCourseRating(userId, courseId) {
  return (await listWhere(COLLECTIONS.courseRatings, "userId", userId)).find((item) => item.courseId === courseId)?.rating ?? null;
}
async function addCourseComment(userId, courseId, content) {
  await createWithId(COLLECTIONS.courseComments, { userId, courseId, content, isApproved: false, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
}
async function getApprovedComments(courseId) {
  return (await listWhere(COLLECTIONS.courseComments, "courseId", courseId)).filter((item) => item.isApproved).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
async function getAllComments(courseId) {
  return (await listWhere(COLLECTIONS.courseComments, "courseId", courseId)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
async function approveComment(id) {
  await updateById(COLLECTIONS.courseComments, id, { isApproved: true });
}
async function deleteComment(id) {
  await deleteById(COLLECTIONS.courseComments, id);
}
async function getContactPage() {
  const reference = db().collection(COLLECTIONS.site).doc("contactPage");
  const snapshot = await reference.get();
  if (snapshot.exists) return read(snapshot);
  const page = { id: 1, displayName: "Cim Bailo", fullName: "Ciss\xE9 Mamadou Bailo", title: "Coach en gestion financi\xE8re", bio: null, photoUrl: null, email: "djawdi@gmail.com", phone: "+1 267 206 44 17", facebook: "https://facebook.com/Cimbailo", youtube: null, tiktok: null, appDescription: null, howItWorks: null, howToUse: null, updatedAt: /* @__PURE__ */ new Date() };
  await reference.set(page);
  return page;
}
async function updateContactPage(data) {
  await getContactPage();
  await db().collection(COLLECTIONS.site).doc("contactPage").update(clean({ ...data, updatedAt: /* @__PURE__ */ new Date() }));
}
async function adminListUsers() {
  const snapshots = await db().collection(COLLECTIONS.users).get();
  const users = snapshots.docs.map((snapshot) => read(snapshot)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return Promise.all(users.map(async (user) => {
    const profile = await getOrCreateProfile(user.id);
    return { ...user, phone: profile.phone, city: profile.city, profileEmail: profile.profileEmail, fullName: profile.fullName, currency: profile.currency };
  }));
}
async function adminSetUserBlocked(userId, blocked) {
  const user = await userById(userId);
  if (!user) throw new Error("Utilisateur introuvable");
  await db().collection(COLLECTIONS.users).doc(user.openId).update({ isBlocked: blocked, updatedAt: /* @__PURE__ */ new Date() });
}
async function adminSetUserRole(userId, role) {
  const user = await userById(userId);
  if (!user) throw new Error("Utilisateur introuvable");
  await db().collection(COLLECTIONS.users).doc(user.openId).update({ role, updatedAt: /* @__PURE__ */ new Date() });
}
async function adminRequestPasswordReset(userId) {
  const user = await userById(userId);
  if (!user) throw new Error("Utilisateur introuvable");
  await db().collection(COLLECTIONS.users).doc(user.openId).update({ passwordResetRequestedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
}
async function adminGetStats() {
  const [users, courses, comments, ads] = await Promise.all([
    db().collection(COLLECTIONS.users).get(),
    db().collection(COLLECTIONS.courses).get(),
    db().collection(COLLECTIONS.courseComments).get(),
    db().collection(COLLECTIONS.ads).get()
  ]);
  return {
    totalUsers: users.size,
    totalCourses: courses.docs.map((snapshot) => read(snapshot)).filter((item) => item.isPublished).length,
    pendingComments: comments.docs.map((snapshot) => read(snapshot)).filter((item) => !item.isApproved).length,
    activeAds: ads.docs.map((snapshot) => read(snapshot)).filter((item) => item.isActive).length
  };
}
async function listAds(activeOnly = false) {
  const snapshots = await db().collection(COLLECTIONS.ads).get();
  const rows = snapshots.docs.map((snapshot) => read(snapshot)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return activeOnly ? rows.filter((item) => item.isActive) : rows;
}
async function createAd(data) {
  await createWithId(COLLECTIONS.ads, { ...data, imageUrl: data.imageUrl ?? null, linkUrl: data.linkUrl ?? null, startsAt: data.startsAt ?? null, endsAt: data.endsAt ?? null, clickCount: 0, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
}
async function updateAd(id, data) {
  await updateById(COLLECTIONS.ads, id, data);
}
async function deleteAd(id) {
  await deleteById(COLLECTIONS.ads, id);
}
async function incrementAdClick(id) {
  const item = await findById(COLLECTIONS.ads, id);
  if (item) await updateById(COLLECTIONS.ads, id, { clickCount: item.clickCount + 1 });
}
async function listAdminNotifications() {
  const snapshots = await db().collection(COLLECTIONS.adminNotifications).get();
  return snapshots.docs.map((snapshot) => read(snapshot)).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()).slice(0, 50);
}
async function createAdminNotification(data) {
  await createWithId(COLLECTIONS.adminNotifications, data);
}
async function adminCreateCourse(data) {
  return createCourse(data);
}
async function adminUpdateCourse(id, data) {
  return updateCourse(id, data);
}
async function adminDeleteCourse(id) {
  return deleteCourse(id);
}
async function adminListCourses() {
  return getAllCourses();
}
async function adminListComments() {
  const snapshots = await db().collection(COLLECTIONS.courseComments).get();
  const comments = snapshots.docs.map((snapshot) => read(snapshot)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return Promise.all(comments.map(async (item) => {
    const [user, course] = await Promise.all([userById(item.userId), getCourseById(item.courseId)]);
    return { ...item, userName: user?.name ?? "Utilisateur", courseTitle: course?.title ?? "Cours supprim\xE9" };
  }));
}
async function adminCreateCourseCategory(data) {
  return createCourseCategory(data);
}
async function adminUpdateCourseCategory(id, data) {
  await updateById(COLLECTIONS.courseCategories, id, data);
}
async function adminDeleteCourseCategory(id) {
  await deleteById(COLLECTIONS.courseCategories, id);
}

// ../server/routers.ts
var monthSchema = z2.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM requis");
var amountSchema = z2.number().positive().max(999999999);
var currencySchema = z2.enum(["GNF", "CFA", "EUR", "USD"]);
var registrationSchema = z2.object({
  fullName: z2.string().trim().min(2, "Le nom complet est requis").max(128),
  phone: z2.string().trim().min(7, "Le num\xE9ro de t\xE9l\xE9phone est requis").max(32).regex(/^[0-9+().\s-]+$/, "Num\xE9ro de t\xE9l\xE9phone invalide"),
  city: z2.string().trim().min(2, "La ville de r\xE9sidence est requise").max(120)
});
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
  return next({ ctx });
});
var adminRouter = router({
  // Stats
  stats: adminProcedure2.query(() => adminGetStats()),
  // Users management
  users: router({
    list: adminProcedure2.query(() => adminListUsers()),
    block: adminProcedure2.input(z2.object({ userId: z2.number(), blocked: z2.boolean() })).mutation(({ input }) => adminSetUserBlocked(input.userId, input.blocked)),
    setRole: adminProcedure2.input(z2.object({ userId: z2.number(), role: z2.enum(["user", "admin"]) })).mutation(({ input }) => adminSetUserRole(input.userId, input.role)),
    requestPasswordReset: adminProcedure2.input(z2.object({ userId: z2.number() })).mutation(({ input }) => adminRequestPasswordReset(input.userId))
  }),
  // Ads management
  ads: router({
    list: adminProcedure2.query(() => listAds()),
    listActive: publicProcedure.query(() => listAds(true)),
    create: adminProcedure2.input(z2.object({
      title: z2.string().min(1).max(128),
      imageUrl: z2.string().optional(),
      linkUrl: z2.string().optional(),
      position: z2.enum(["dashboard_top", "dashboard_bottom", "sidebar", "learn_page"]).default("dashboard_top"),
      isActive: z2.boolean().default(true),
      startsAt: z2.date().optional(),
      endsAt: z2.date().optional()
    })).mutation(({ input }) => createAd(input)),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      title: z2.string().min(1).max(128).optional(),
      imageUrl: z2.string().optional(),
      linkUrl: z2.string().optional(),
      position: z2.enum(["dashboard_top", "dashboard_bottom", "sidebar", "learn_page"]).optional(),
      isActive: z2.boolean().optional(),
      startsAt: z2.date().optional(),
      endsAt: z2.date().optional()
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return updateAd(id, data);
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(({ input }) => deleteAd(input.id)),
    click: publicProcedure.input(z2.object({ id: z2.number() })).mutation(({ input }) => incrementAdClick(input.id))
  }),
  // Notifications
  notifications: router({
    list: adminProcedure2.query(() => listAdminNotifications()),
    send: adminProcedure2.input(z2.object({ title: z2.string().min(1).max(128), message: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
      const allUsers = await adminListUsers();
      await createAdminNotification({
        title: input.title,
        message: input.message,
        sentAt: /* @__PURE__ */ new Date(),
        sentBy: ctx.user.id,
        recipientCount: allUsers.length
      });
      return { sent: allUsers.length };
    })
  }),
  // Courses admin
  courses: router({
    list: adminProcedure2.query(() => adminListCourses()),
    create: adminProcedure2.input(z2.object({
      title: z2.string().min(1).max(128),
      slug: z2.string().min(1).max(128),
      excerpt: z2.string().max(256).optional(),
      content: z2.string().default(""),
      coverEmoji: z2.string().default("\u{1F4D6}"),
      readingMinutes: z2.number().int().min(1).default(5),
      categoryId: z2.number().optional(),
      isPublished: z2.boolean().default(false),
      allowLikes: z2.boolean().default(true),
      allowRatings: z2.boolean().default(true),
      allowComments: z2.boolean().default(true),
      sortOrder: z2.number().int().default(0)
    })).mutation(({ input }) => adminCreateCourse(input)),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      title: z2.string().min(1).max(128).optional(),
      slug: z2.string().min(1).max(128).optional(),
      excerpt: z2.string().max(256).optional(),
      content: z2.string().optional(),
      coverEmoji: z2.string().optional(),
      readingMinutes: z2.number().int().min(1).optional(),
      categoryId: z2.number().optional(),
      isPublished: z2.boolean().optional(),
      allowLikes: z2.boolean().optional(),
      allowRatings: z2.boolean().optional(),
      allowComments: z2.boolean().optional(),
      sortOrder: z2.number().int().optional()
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return adminUpdateCourse(id, data);
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(({ input }) => adminDeleteCourse(input.id))
  }),
  // Comments moderation
  comments: router({
    list: adminProcedure2.query(() => adminListComments()),
    approve: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(({ input }) => approveComment(input.id)),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(({ input }) => deleteComment(input.id))
  }),
  // Course categories admin
  courseCategories: router({
    create: adminProcedure2.input(z2.object({ name: z2.string().min(1).max(64), icon: z2.string().default("\u{1F4DA}"), color: z2.string().default("emerald"), sortOrder: z2.number().int().default(0) })).mutation(({ input }) => adminCreateCourseCategory(input)),
    update: adminProcedure2.input(z2.object({ id: z2.number(), name: z2.string().optional(), icon: z2.string().optional(), color: z2.string().optional(), sortOrder: z2.number().int().optional() })).mutation(({ input }) => {
      const { id, ...data } = input;
      return adminUpdateCourseCategory(id, data);
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(({ input }) => adminDeleteCourseCategory(input.id))
  }),
  // Contact page admin
  contact: router({
    get: adminProcedure2.query(() => getContactPage()),
    update: adminProcedure2.input(z2.object({
      displayName: z2.string().min(1).max(128).optional(),
      fullName: z2.string().min(1).max(256).optional(),
      title: z2.string().min(1).max(256).optional(),
      bio: z2.string().optional(),
      photoUrl: z2.string().optional(),
      email: z2.string().optional(),
      phone: z2.string().optional(),
      facebook: z2.string().optional(),
      youtube: z2.string().optional(),
      tiktok: z2.string().optional(),
      appDescription: z2.string().optional(),
      howItWorks: z2.string().optional(),
      howToUse: z2.string().optional()
    })).mutation(({ input }) => updateContactPage(input))
  }),
  // Global settings admin
  settings: router({
    get: adminProcedure2.query(() => getLearningSettings()),
    update: adminProcedure2.input(z2.object({
      youtubeUrl: z2.string().optional(),
      allowLikes: z2.boolean().optional(),
      allowRatings: z2.boolean().optional(),
      allowComments: z2.boolean().optional()
    })).mutation(({ input }) => updateLearningSettings(input))
  })
});
var appRouter = router({
  system: systemRouter,
  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      return { success: true };
    })
  }),
  registration: router({
    completeProfile: publicProcedure.input(registrationSchema).mutation(async ({ ctx, input }) => {
      const header = ctx.req.headers.authorization;
      if (typeof header !== "string" || !header.startsWith("Bearer ")) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Connexion requise pour finaliser l'inscription" });
      }
      const decoded = await getFirebaseAdminAuth().verifyIdToken(header.slice(7), true);
      if (!decoded.uid || !decoded.email) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Identit\xE9 Firebase invalide" });
      }
      await completeRegistrationProfile({
        openId: decoded.uid,
        email: decoded.email,
        fullName: input.fullName,
        phone: input.phone,
        city: input.city
      });
      return { success: true };
    })
  }),
  // ─── Profile ───────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getOrCreateProfile(ctx.user.id)),
    update: protectedProcedure.input(z2.object({
      fullName: z2.string().min(1).max(128).optional(),
      currency: currencySchema.optional(),
      phone: z2.string().max(32).nullable().optional(),
      city: z2.string().trim().min(2).max(120).nullable().optional(),
      profileEmail: z2.string().email().max(320).nullable().optional()
    })).mutation(({ ctx, input }) => updateProfile(ctx.user.id, input))
  }),
  // ─── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return ensureDefaultCategories(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1).max(64),
      icon: z2.string().max(8).optional(),
      description: z2.string().max(128).optional()
    })).mutation(({ ctx, input }) => createCategory(ctx.user.id, input))
  }),
  // ─── Revenues ──────────────────────────────────────────────────────────────
  revenues: router({
    list: protectedProcedure.input(z2.object({ month: monthSchema })).query(({ ctx, input }) => getRevenues(ctx.user.id, input.month)),
    add: protectedProcedure.input(z2.object({
      amount: amountSchema,
      description: z2.string().min(1).max(128),
      month: monthSchema
    })).mutation(
      ({ ctx, input }) => addRevenue(ctx.user.id, { amount: input.amount.toString(), description: input.description, month: input.month })
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteRevenue(ctx.user.id, input.id))
  }),
  // ─── Budgets ───────────────────────────────────────────────────────────────
  budgets: router({
    list: protectedProcedure.input(z2.object({ month: monthSchema })).query(({ ctx, input }) => getBudgets(ctx.user.id, input.month)),
    upsert: protectedProcedure.input(z2.object({
      categoryId: z2.number().int().positive(),
      amount: z2.number().min(0).max(999999999),
      month: monthSchema
    })).mutation(
      ({ ctx, input }) => upsertBudget(ctx.user.id, input.categoryId, input.amount.toString(), input.month)
    )
  }),
  // ─── Expenses ──────────────────────────────────────────────────────────────
  expenses: router({
    list: protectedProcedure.input(z2.object({ month: monthSchema })).query(({ ctx, input }) => getExpenses(ctx.user.id, input.month)),
    add: protectedProcedure.input(z2.object({
      categoryId: z2.number().int().positive(),
      amount: amountSchema,
      description: z2.string().min(1).max(128),
      month: monthSchema
    })).mutation(
      ({ ctx, input }) => addExpense(ctx.user.id, { categoryId: input.categoryId, amount: input.amount.toString(), description: input.description, month: input.month })
    ),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteExpense(ctx.user.id, input.id))
  }),
  // ─── Caisse ────────────────────────────────────────────────────────────────
  caisse: router({
    get: protectedProcedure.query(({ ctx }) => getCaisseData(ctx.user.id))
  }),
  // ─── Synthesis ─────────────────────────────────────────────────────────────
  synthesis: router({
    history: protectedProcedure.query(({ ctx }) => getSynthesisData(ctx.user.id))
  }),
  // ─── Scheduled Payments ────────────────────────────────────────────────────
  scheduledPayments: router({
    list: protectedProcedure.query(({ ctx }) => getScheduledPayments(ctx.user.id)),
    create: protectedProcedure.input(z2.object({
      categoryId: z2.number().int().positive(),
      description: z2.string().min(1).max(128),
      amount: amountSchema,
      dayOfMonth: z2.number().int().min(1).max(31)
    })).mutation(
      ({ ctx, input }) => createScheduledPayment(ctx.user.id, { ...input, amount: input.amount.toString() })
    ),
    toggle: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ ctx, input }) => toggleScheduledPayment(ctx.user.id, input.id)),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteScheduledPayment(ctx.user.id, input.id)),
    execute: protectedProcedure.input(z2.object({ id: z2.number().int().positive(), month: monthSchema })).mutation(async ({ ctx, input }) => {
      try {
        await executeScheduledPayment(ctx.user.id, input.id, input.month);
        return { success: true };
      } catch (err) {
        if (err instanceof Error && err.message === "DUPLICATE") {
          throw new TRPCError3({ code: "CONFLICT", message: "Cette d\xE9pense a d\xE9j\xE0 \xE9t\xE9 enregistr\xE9e pour ce mois." });
        }
        throw err;
      }
    })
  }),
  // ─── Learning module ───────────────────────────────────────────────────────
  learning: router({
    settings: publicProcedure.query(() => getLearningSettings()),
    updateSettings: protectedProcedure.input(z2.object({
      youtubeChannelUrl: z2.string().url().max(256).nullable().optional(),
      showYoutubeButton: z2.boolean().optional(),
      allowLikes: z2.boolean().optional(),
      allowRatings: z2.boolean().optional(),
      allowComments: z2.boolean().optional()
    })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return updateLearningSettings(input);
    }),
    categories: publicProcedure.query(() => getCourseCategories()),
    createCategory: protectedProcedure.input(z2.object({ name: z2.string().min(1).max(64), icon: z2.string().max(8).optional(), color: z2.string().max(32).optional() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return createCourseCategory(input);
    }),
    list: publicProcedure.query(() => getPublishedCourses()),
    listAll: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return getAllCourses();
    }),
    get: publicProcedure.input(z2.object({ slug: z2.string() })).query(({ input }) => getCourseBySlug(input.slug)),
    create: protectedProcedure.input(z2.object({
      categoryId: z2.number().int().positive().optional(),
      title: z2.string().min(1).max(128),
      slug: z2.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
      excerpt: z2.string().max(256).optional(),
      content: z2.string(),
      coverEmoji: z2.string().max(8).optional(),
      readingMinutes: z2.number().int().min(1).max(120).optional(),
      isPublished: z2.boolean().optional(),
      allowLikes: z2.boolean().optional(),
      allowRatings: z2.boolean().optional(),
      allowComments: z2.boolean().optional(),
      sortOrder: z2.number().int().optional()
    })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return createCourse({ ...input, categoryId: input.categoryId ?? null, excerpt: input.excerpt ?? null, content: input.content ?? "", coverEmoji: input.coverEmoji ?? "\u{1F4D6}", readingMinutes: input.readingMinutes ?? 5, isPublished: input.isPublished ?? false, allowLikes: input.allowLikes ?? true, allowRatings: input.allowRatings ?? true, allowComments: input.allowComments ?? true, sortOrder: input.sortOrder ?? 0 });
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int().positive(),
      title: z2.string().min(1).max(128).optional(),
      slug: z2.string().min(1).max(128).regex(/^[a-z0-9-]+$/).optional(),
      excerpt: z2.string().max(256).optional(),
      content: z2.string().optional(),
      coverEmoji: z2.string().max(8).optional(),
      readingMinutes: z2.number().int().min(1).max(120).optional(),
      isPublished: z2.boolean().optional(),
      allowLikes: z2.boolean().optional(),
      allowRatings: z2.boolean().optional(),
      allowComments: z2.boolean().optional(),
      sortOrder: z2.number().int().optional(),
      categoryId: z2.number().int().positive().nullable().optional()
    })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      return updateCourse(id, data);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return deleteCourse(input.id);
    }),
    myProgress: protectedProcedure.query(({ ctx }) => getUserCourseProgress(ctx.user.id)),
    markComplete: protectedProcedure.input(z2.object({ courseId: z2.number().int().positive() })).mutation(({ ctx, input }) => markCourseComplete(ctx.user.id, input.courseId)),
    unmarkComplete: protectedProcedure.input(z2.object({ courseId: z2.number().int().positive() })).mutation(({ ctx, input }) => unmarkCourseComplete(ctx.user.id, input.courseId)),
    toggleLike: protectedProcedure.input(z2.object({ courseId: z2.number().int().positive() })).mutation(({ ctx, input }) => toggleCourseLike(ctx.user.id, input.courseId)),
    likesCount: publicProcedure.input(z2.object({ courseId: z2.number().int().positive() })).query(({ input }) => getCourseLikesCount(input.courseId)),
    myLikes: protectedProcedure.query(({ ctx }) => getUserLikedCourses(ctx.user.id)),
    rate: protectedProcedure.input(z2.object({ courseId: z2.number().int().positive(), rating: z2.number().int().min(1).max(5) })).mutation(({ ctx, input }) => upsertCourseRating(ctx.user.id, input.courseId, input.rating)),
    avgRating: publicProcedure.input(z2.object({ courseId: z2.number().int().positive() })).query(({ input }) => getCourseAverageRating(input.courseId)),
    myRating: protectedProcedure.input(z2.object({ courseId: z2.number().int().positive() })).query(({ ctx, input }) => getUserCourseRating(ctx.user.id, input.courseId)),
    comment: protectedProcedure.input(z2.object({ courseId: z2.number().int().positive(), content: z2.string().min(1).max(1e3) })).mutation(({ ctx, input }) => addCourseComment(ctx.user.id, input.courseId, input.content)),
    comments: publicProcedure.input(z2.object({ courseId: z2.number().int().positive() })).query(({ input }) => getApprovedComments(input.courseId)),
    allComments: protectedProcedure.input(z2.object({ courseId: z2.number().int().positive() })).query(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return getAllComments(input.courseId);
    }),
    approveComment: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return approveComment(input.id);
    }),
    deleteComment: protectedProcedure.input(z2.object({ id: z2.number().int().positive() })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return deleteComment(input.id);
    })
  }),
  contact: router({
    get: publicProcedure.query(() => getContactPage()),
    update: protectedProcedure.input(
      z2.object({
        displayName: z2.string().min(1).max(128).optional(),
        fullName: z2.string().min(1).max(256).optional(),
        title: z2.string().min(1).max(256).optional(),
        bio: z2.string().optional(),
        photoUrl: z2.string().optional(),
        email: z2.string().optional(),
        phone: z2.string().optional(),
        facebook: z2.string().optional(),
        youtube: z2.string().optional(),
        tiktok: z2.string().optional(),
        appDescription: z2.string().optional(),
        howItWorks: z2.string().optional(),
        howToUse: z2.string().optional()
      })
    ).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
      return updateContactPage(input);
    })
  }),
  admin: adminRouter
});

// ../server/_core/context.ts
function hasVerifiedEmail(decoded) {
  return typeof decoded.email === "string" && decoded.email.length > 0 && decoded.email_verified === true;
}
async function getFirebaseUser(req) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) return null;
  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(authHeader.slice(7), true);
    if (!hasVerifiedEmail(decoded)) return null;
    const email = decoded.email ?? null;
    const name = decoded.name ?? email?.split("@")[0] ?? "Utilisateur";
    const loginMethod = typeof decoded.firebase?.sign_in_provider === "string" ? decoded.firebase.sign_in_provider : "email";
    await upsertUser({
      openId: decoded.uid,
      name,
      email,
      loginMethod,
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    const user = await getUserByOpenId(decoded.uid);
    if (!user || user.isBlocked) return null;
    return user;
  } catch (error) {
    console.warn("[Auth] Firebase token verification failed:", String(error));
    return null;
  }
}
async function createContext(opts) {
  const user = await getFirebaseUser(opts.req).catch(() => null);
  return { req: opts.req, res: opts.res, user };
}

// ../server/_core/security.ts
function applySecurityMiddleware(app2) {
  app2.disable("x-powered-by");
  app2.use((_req, res, next) => {
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

// ../server/firebaseApi.ts
var app = express();
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
    createContext
  })
);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});
var api = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
    minInstances: 0,
    maxInstances: 2,
    concurrency: 20,
    invoker: "public",
    serviceAccount: "djawdi-api@gestion-djawdi.iam.gserviceaccount.com"
  },
  app
);
export {
  api
};
