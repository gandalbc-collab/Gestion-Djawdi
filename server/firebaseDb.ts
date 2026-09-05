import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminDb } from "./_core/firebaseAdmin";

type Currency = "GNF" | "CFA" | "EUR" | "USD";
type Role = "admin" | "user";
type AdPosition = "dashboard_top" | "dashboard_bottom" | "sidebar" | "learn_page";

export type FirebaseUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
  isBlocked: boolean;
  passwordResetRequestedAt: Date | null;
};

export type UserProfile = {
  id: number;
  userId: number;
  fullName: string | null;
  currency: Currency;
  phone: string | null;
  city: string | null;
  profileEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: number;
  userId: number;
  name: string;
  icon: string;
  description: string | null;
  isCustom: boolean;
  createdAt: Date;
};

export type Revenue = { id: number; userId: number; amount: string; description: string; month: string; createdAt: Date };
export type Budget = { id: number; userId: number; categoryId: number; amount: string; month: string; createdAt: Date; updatedAt: Date };
export type Expense = { id: number; userId: number; categoryId: number; amount: string; description: string; month: string; createdAt: Date };
export type ScheduledPayment = { id: number; userId: number; categoryId: number; description: string; amount: string; dayOfMonth: number; isActive: boolean; createdAt: Date; updatedAt: Date };
export type CourseCategory = { id: number; name: string; icon: string; color: string; sortOrder: number; createdAt: Date };
export type Course = { id: number; categoryId: number | null; title: string; slug: string; excerpt: string | null; content: string; coverEmoji: string; readingMinutes: number; isPublished: boolean; allowLikes: boolean; allowRatings: boolean; allowComments: boolean; sortOrder: number; createdAt: Date; updatedAt: Date };
export type CourseProgress = { id: number; userId: number; courseId: number; completedAt: Date };
export type CourseLike = { id: number; userId: number; courseId: number; createdAt: Date };
export type CourseRating = { id: number; userId: number; courseId: number; rating: number; createdAt: Date; updatedAt: Date };
export type CourseComment = { id: number; userId: number; courseId: number; content: string; isApproved: boolean; createdAt: Date; updatedAt: Date };
export type LearningSettings = { id: number; youtubeChannelUrl: string | null; showYoutubeButton: boolean; allowLikes: boolean; allowRatings: boolean; allowComments: boolean; updatedAt: Date };
export type ContactPage = { id: number; displayName: string; fullName: string; title: string; bio: string | null; photoUrl: string | null; email: string | null; phone: string | null; facebook: string | null; youtube: string | null; tiktok: string | null; appDescription: string | null; howItWorks: string | null; howToUse: string | null; updatedAt: Date };
export type Ad = { id: number; title: string; imageUrl: string | null; linkUrl: string | null; position: AdPosition; isActive: boolean; startsAt: Date | null; endsAt: Date | null; clickCount: number; createdAt: Date; updatedAt: Date };
export type AdminNotification = { id: number; title: string; message: string; sentAt: Date; sentBy: number; recipientCount: number };

const COLLECTIONS = {
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
  counters: "counters",
} as const;

const DEFAULT_CATEGORIES = [
  { name: "Logement", icon: "🏠", description: "Loyer, courant, eau, nettoyage" },
  { name: "Abonnements", icon: "📱", description: "Téléphone, TV, Internet" },
  { name: "Alimentation", icon: "🍽️", description: "Courses et repas" },
  { name: "Santé", icon: "💊", description: "Hygiène et soins" },
  { name: "Véhicule", icon: "🚗", description: "Transport et assurance" },
  { name: "Dettes", icon: "💳", description: "Remboursements" },
  { name: "Épargne", icon: "💰", description: "Fond d'urgence" },
  { name: "Dépenses pro", icon: "💼", description: "Obligatoire pour le travail" },
  { name: "Famille", icon: "👨‍👩‍👧", description: "Dépenses familiales" },
  { name: "Obligations sociales", icon: "🤝", description: "Cérémonies et charité" },
  { name: "Loisirs", icon: "🎮", description: "Divertissement" },
  { name: "Taxes", icon: "📋", description: "Impôts et frais de service" },
  { name: "Imprévus", icon: "⚡", description: "Dépenses surprises" },
  { name: "Exceptionnel", icon: "✈️", description: "Vacances et sorties" },
  { name: "Investissement", icon: "📈", description: "Retraite et liberté financière" },
];

function db() {
  return getFirebaseAdminDb();
}

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function normalise(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalise(entry)]));
  return value;
}

function read<T>(snapshot: { data: () => Record<string, unknown> | undefined }): T {
  const data = snapshot.data();
  if (!data) throw new Error("Document Firestore introuvable");
  return normalise(data) as T;
}

async function nextId(collection: string): Promise<number> {
  const counter = db().collection(COLLECTIONS.counters).doc(collection);
  return db().runTransaction(async transaction => {
    const previous = await transaction.get(counter);
    const id = (previous.exists ? Number(previous.data()?.value ?? 0) : 0) + 1;
    transaction.set(counter, { value: id, updatedAt: new Date() });
    return id;
  });
}

async function createWithId<T extends Record<string, unknown>>(collection: string, data: Omit<T, "id">): Promise<T> {
  const id = await nextId(collection);
  const item = { id, ...data } as unknown as T;
  await db().collection(collection).doc(String(id)).set(clean(item));
  return item;
}

async function listWhere<T>(collection: string, field: string, value: unknown): Promise<T[]> {
  const snapshots = await db().collection(collection).where(field, "==", value).get();
  return snapshots.docs.map(snapshot => read<T>(snapshot));
}

async function findById<T>(collection: string, id: number): Promise<T | null> {
  const snapshot = await db().collection(collection).doc(String(id)).get();
  return snapshot.exists ? read<T>(snapshot) : null;
}

async function updateById(collection: string, id: number, patch: Record<string, unknown>): Promise<void> {
  await db().collection(collection).doc(String(id)).update(clean({ ...patch, updatedAt: new Date() }));
}

async function deleteById(collection: string, id: number): Promise<void> {
  await db().collection(collection).doc(String(id)).delete();
}

async function userById(id: number): Promise<FirebaseUser | null> {
  const rows = await listWhere<FirebaseUser>(COLLECTIONS.users, "id", id);
  return rows[0] ?? null;
}

export async function upsertUser(user: { openId: string; name?: string | null; email?: string | null; loginMethod?: string | null; lastSignedIn?: Date }): Promise<void> {
  const reference = db().collection(COLLECTIONS.users).doc(user.openId);
  const current = await reference.get();
  const now = new Date();
  if (!current.exists) {
    const id = await nextId(COLLECTIONS.users);
    await reference.set(clean({
      id,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? "email",
      role: "user" as Role,
      isBlocked: false,
      passwordResetRequestedAt: null,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    }));
    return;
  }
  await reference.update(clean({
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    lastSignedIn: user.lastSignedIn ?? now,
    updatedAt: now,
  }));
}

export async function getUserByOpenId(openId: string): Promise<FirebaseUser | undefined> {
  const snapshot = await db().collection(COLLECTIONS.users).doc(openId).get();
  return snapshot.exists ? read<FirebaseUser>(snapshot) : undefined;
}

export async function getOrCreateProfile(userId: number): Promise<UserProfile> {
  const reference = db().collection(COLLECTIONS.profiles).doc(String(userId));
  const snapshot = await reference.get();
  if (snapshot.exists) return read<UserProfile>(snapshot);
  const now = new Date();
  const profile: UserProfile = { id: userId, userId, fullName: null, currency: "GNF", phone: null, city: null, profileEmail: null, createdAt: now, updatedAt: now };
  await reference.set(profile);
  return profile;
}

export async function updateProfile(userId: number, data: { fullName?: string; currency?: Currency; phone?: string | null; city?: string | null; profileEmail?: string | null }) {
  await getOrCreateProfile(userId);
  await db().collection(COLLECTIONS.profiles).doc(String(userId)).update(clean({ ...data, updatedAt: new Date() }));
  return getOrCreateProfile(userId);
}

/** Stores mandatory contact details immediately after a Firebase registration. */
export async function completeRegistrationProfile(data: { openId: string; email: string; fullName: string; phone: string; city: string }): Promise<void> {
  const userReference = db().collection(COLLECTIONS.users).doc(data.openId);
  const now = new Date();

  await db().runTransaction(async transaction => {
    const existingUser = await transaction.get(userReference);
    const profileReference = db().collection(COLLECTIONS.profiles).doc(String(existingUser.exists ? Number(existingUser.data()?.id) : "pending"));
    const existingProfile = existingUser.exists ? await transaction.get(profileReference) : null;
    let userId: number;

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
        role: "user" as Role,
        isBlocked: false,
        passwordResetRequestedAt: null,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
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
      updatedAt: now,
    }), { merge: true });
  });
}

export async function ensureDefaultCategories(userId: number): Promise<Category[]> {
  const existing = await listWhere<Category>(COLLECTIONS.categories, "userId", userId);
  if (existing.length) return existing.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const category of DEFAULT_CATEGORIES) await createCategory(userId, { ...category });
  return getCategories(userId);
}

export async function getCategories(userId: number): Promise<Category[]> {
  const rows = await listWhere<Category>(COLLECTIONS.categories, "userId", userId);
  return rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function createCategory(userId: number, data: { name: string; icon?: string; description?: string }) {
  await createWithId<Category>(COLLECTIONS.categories, { userId, name: data.name, icon: data.icon ?? "📌", description: data.description ?? null, isCustom: true, createdAt: new Date() });
  return getCategories(userId);
}

export async function getRevenues(userId: number, month: string): Promise<Revenue[]> {
  return (await listWhere<Revenue>(COLLECTIONS.revenues, "userId", userId)).filter(item => item.month === month).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function addRevenue(userId: number, data: { amount: string; description: string; month: string }) {
  await createWithId<Revenue>(COLLECTIONS.revenues, { userId, ...data, createdAt: new Date() });
}

export async function deleteRevenue(userId: number, id: number) {
  const item = await findById<Revenue>(COLLECTIONS.revenues, id);
  if (item?.userId === userId) await deleteById(COLLECTIONS.revenues, id);
}

export async function getBudgets(userId: number, month: string): Promise<Budget[]> {
  return (await listWhere<Budget>(COLLECTIONS.budgets, "userId", userId)).filter(item => item.month === month);
}

export async function upsertBudget(userId: number, categoryId: number, amount: string, month: string) {
  const existing = (await getBudgets(userId, month)).find(item => item.categoryId === categoryId);
  if (existing) return updateById(COLLECTIONS.budgets, existing.id, { amount });
  await createWithId<Budget>(COLLECTIONS.budgets, { userId, categoryId, amount, month, createdAt: new Date(), updatedAt: new Date() });
}

export async function getExpenses(userId: number, month: string): Promise<Expense[]> {
  return (await listWhere<Expense>(COLLECTIONS.expenses, "userId", userId)).filter(item => item.month === month).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function addExpense(userId: number, data: { categoryId: number; amount: string; description: string; month: string }) {
  await createWithId<Expense>(COLLECTIONS.expenses, { userId, ...data, createdAt: new Date() });
}

export async function deleteExpense(userId: number, id: number) {
  const item = await findById<Expense>(COLLECTIONS.expenses, id);
  if (item?.userId === userId) await deleteById(COLLECTIONS.expenses, id);
}

export async function getCaisseData(userId: number) {
  const [allRevenues, allExpenses, categories] = await Promise.all([
    listWhere<Revenue>(COLLECTIONS.revenues, "userId", userId),
    listWhere<Expense>(COLLECTIONS.expenses, "userId", userId),
    getCategories(userId),
  ]);
  const savingId = categories.find(category => category.name === "Épargne")?.id;
  const cumulativeSurplus = allRevenues.reduce((sum, item) => sum + Number(item.amount), 0) - allExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const cumulativeSavings = allExpenses.filter(item => item.categoryId === savingId).reduce((sum, item) => sum + Number(item.amount), 0);
  return { cumulativeSurplus, cumulativeSavings };
}

export async function getSynthesisData(userId: number) {
  const [allRevenues, allExpenses, allBudgets] = await Promise.all([
    listWhere<Revenue>(COLLECTIONS.revenues, "userId", userId),
    listWhere<Expense>(COLLECTIONS.expenses, "userId", userId),
    listWhere<Budget>(COLLECTIONS.budgets, "userId", userId),
  ]);
  const months = new Set([...allRevenues, ...allExpenses, ...allBudgets].map(item => item.month));
  return Array.from(months).sort().reverse().map(month => {
    const revenues = allRevenues.filter(item => item.month === month).reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = allExpenses.filter(item => item.month === month).reduce((sum, item) => sum + Number(item.amount), 0);
    const budget = allBudgets.filter(item => item.month === month).reduce((sum, item) => sum + Number(item.amount), 0);
    return { month, revenues, expenses, budget, variance: budget - expenses };
  });
}

export async function getScheduledPayments(userId: number): Promise<ScheduledPayment[]> {
  return (await listWhere<ScheduledPayment>(COLLECTIONS.scheduledPayments, "userId", userId)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createScheduledPayment(userId: number, data: { categoryId: number; description: string; amount: string; dayOfMonth: number }) {
  await createWithId<ScheduledPayment>(COLLECTIONS.scheduledPayments, { userId, ...data, isActive: true, createdAt: new Date(), updatedAt: new Date() });
  return getScheduledPayments(userId);
}

export async function toggleScheduledPayment(userId: number, id: number) {
  const item = await findById<ScheduledPayment>(COLLECTIONS.scheduledPayments, id);
  if (!item || item.userId !== userId) throw new Error("Not found");
  await updateById(COLLECTIONS.scheduledPayments, id, { isActive: !item.isActive });
}

export async function deleteScheduledPayment(userId: number, id: number) {
  const item = await findById<ScheduledPayment>(COLLECTIONS.scheduledPayments, id);
  if (item?.userId === userId) await deleteById(COLLECTIONS.scheduledPayments, id);
}

export async function executeScheduledPayment(userId: number, id: number, month: string) {
  const payment = await findById<ScheduledPayment>(COLLECTIONS.scheduledPayments, id);
  if (!payment || payment.userId !== userId) throw new Error("Scheduled payment not found");
  const duplicate = (await getExpenses(userId, month)).find(item => item.description === `${payment.description} (Programmé)`);
  if (duplicate) throw new Error("DUPLICATE");
  await addExpense(userId, { categoryId: payment.categoryId, amount: payment.amount, description: `${payment.description} (Programmé)`, month });
}

export async function getLearningSettings(): Promise<LearningSettings> {
  const reference = db().collection(COLLECTIONS.site).doc("learningSettings");
  const snapshot = await reference.get();
  if (snapshot.exists) return read<LearningSettings>(snapshot);
  const settings: LearningSettings = { id: 1, youtubeChannelUrl: null, showYoutubeButton: true, allowLikes: true, allowRatings: true, allowComments: true, updatedAt: new Date() };
  await reference.set(settings);
  return settings;
}

export async function updateLearningSettings(data: Partial<LearningSettings> & { youtubeUrl?: string }) {
  const reference = db().collection(COLLECTIONS.site).doc("learningSettings");
  await getLearningSettings();
  const { youtubeUrl, ...rest } = data;
  await reference.update(clean({ ...rest, youtubeChannelUrl: rest.youtubeChannelUrl ?? youtubeUrl, updatedAt: new Date() }));
}

export async function getCourseCategories(): Promise<CourseCategory[]> {
  const snapshots = await db().collection(COLLECTIONS.courseCategories).get();
  return snapshots.docs.map(snapshot => read<CourseCategory>(snapshot)).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createCourseCategory(data: { name: string; icon?: string; color?: string; sortOrder?: number }) {
  await createWithId<CourseCategory>(COLLECTIONS.courseCategories, { name: data.name, icon: data.icon ?? "📚", color: data.color ?? "emerald", sortOrder: data.sortOrder ?? 0, createdAt: new Date() });
}

export async function getPublishedCourses(): Promise<Course[]> {
  const snapshots = await db().collection(COLLECTIONS.courses).get();
  return snapshots.docs.map(snapshot => read<Course>(snapshot)).filter(course => course.isPublished).sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getAllCourses(): Promise<Course[]> {
  const snapshots = await db().collection(COLLECTIONS.courses).get();
  return snapshots.docs.map(snapshot => read<Course>(snapshot)).sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const rows = await listWhere<Course>(COLLECTIONS.courses, "slug", slug);
  return rows[0] ?? null;
}

export async function getCourseById(id: number): Promise<Course | null> {
  return findById<Course>(COLLECTIONS.courses, id);
}

export async function createCourse(data: Omit<Course, "id" | "createdAt" | "updatedAt">) {
  const duplicate = await getCourseBySlug(data.slug);
  if (duplicate) throw new Error("Un cours utilise déjà cet identifiant.");
  await createWithId<Course>(COLLECTIONS.courses, { ...data, categoryId: data.categoryId ?? null, excerpt: data.excerpt ?? null, createdAt: new Date(), updatedAt: new Date() });
}

export async function updateCourse(id: number, data: Partial<Omit<Course, "id" | "createdAt" | "updatedAt">>) {
  if (data.slug) {
    const duplicate = await getCourseBySlug(data.slug);
    if (duplicate && duplicate.id !== id) throw new Error("Un cours utilise déjà cet identifiant.");
  }
  await updateById(COLLECTIONS.courses, id, data);
}

export async function deleteCourse(id: number) { await deleteById(COLLECTIONS.courses, id); }

export async function getUserCourseProgress(userId: number): Promise<CourseProgress[]> { return listWhere<CourseProgress>(COLLECTIONS.courseProgress, "userId", userId); }

export async function markCourseComplete(userId: number, courseId: number) {
  const existing = (await getUserCourseProgress(userId)).find(item => item.courseId === courseId);
  if (!existing) await createWithId<CourseProgress>(COLLECTIONS.courseProgress, { userId, courseId, completedAt: new Date() });
}

export async function unmarkCourseComplete(userId: number, courseId: number) {
  const item = (await getUserCourseProgress(userId)).find(progress => progress.courseId === courseId);
  if (item) await deleteById(COLLECTIONS.courseProgress, item.id);
}

export async function toggleCourseLike(userId: number, courseId: number): Promise<boolean> {
  const existing = (await listWhere<CourseLike>(COLLECTIONS.courseLikes, "userId", userId)).find(item => item.courseId === courseId);
  if (existing) { await deleteById(COLLECTIONS.courseLikes, existing.id); return false; }
  await createWithId<CourseLike>(COLLECTIONS.courseLikes, { userId, courseId, createdAt: new Date() });
  return true;
}

export async function getCourseLikesCount(courseId: number) { return (await listWhere<CourseLike>(COLLECTIONS.courseLikes, "courseId", courseId)).length; }
export async function getUserLikedCourses(userId: number): Promise<CourseLike[]> { return listWhere<CourseLike>(COLLECTIONS.courseLikes, "userId", userId); }

export async function upsertCourseRating(userId: number, courseId: number, rating: number) {
  const existing = (await listWhere<CourseRating>(COLLECTIONS.courseRatings, "userId", userId)).find(item => item.courseId === courseId);
  if (existing) return updateById(COLLECTIONS.courseRatings, existing.id, { rating });
  await createWithId<CourseRating>(COLLECTIONS.courseRatings, { userId, courseId, rating, createdAt: new Date(), updatedAt: new Date() });
}

export async function getCourseAverageRating(courseId: number) {
  const ratings = await listWhere<CourseRating>(COLLECTIONS.courseRatings, "courseId", courseId);
  if (!ratings.length) return null;
  return { average: Math.round((ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length) * 10) / 10, count: ratings.length };
}

export async function getUserCourseRating(userId: number, courseId: number) {
  return (await listWhere<CourseRating>(COLLECTIONS.courseRatings, "userId", userId)).find(item => item.courseId === courseId)?.rating ?? null;
}

export async function addCourseComment(userId: number, courseId: number, content: string) {
  await createWithId<CourseComment>(COLLECTIONS.courseComments, { userId, courseId, content, isApproved: false, createdAt: new Date(), updatedAt: new Date() });
}

export async function getApprovedComments(courseId: number) {
  return (await listWhere<CourseComment>(COLLECTIONS.courseComments, "courseId", courseId)).filter(item => item.isApproved).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getAllComments(courseId: number) { return (await listWhere<CourseComment>(COLLECTIONS.courseComments, "courseId", courseId)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); }
export async function approveComment(id: number) { await updateById(COLLECTIONS.courseComments, id, { isApproved: true }); }
export async function deleteComment(id: number) { await deleteById(COLLECTIONS.courseComments, id); }

export async function getContactPage(): Promise<ContactPage> {
  const reference = db().collection(COLLECTIONS.site).doc("contactPage");
  const snapshot = await reference.get();
  if (snapshot.exists) return read<ContactPage>(snapshot);
  const page: ContactPage = { id: 1, displayName: "Cim Bailo", fullName: "Cissé Mamadou Bailo", title: "Coach en gestion financière", bio: null, photoUrl: null, email: "djawdi@gmail.com", phone: "+1 267 206 44 17", facebook: "https://facebook.com/Cimbailo", youtube: null, tiktok: null, appDescription: null, howItWorks: null, howToUse: null, updatedAt: new Date() };
  await reference.set(page);
  return page;
}

export async function updateContactPage(data: Partial<Omit<ContactPage, "id" | "updatedAt">>) {
  await getContactPage();
  await db().collection(COLLECTIONS.site).doc("contactPage").update(clean({ ...data, updatedAt: new Date() }));
}

export async function adminListUsers() {
  const snapshots = await db().collection(COLLECTIONS.users).get();
  const users = snapshots.docs.map(snapshot => read<FirebaseUser>(snapshot)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return Promise.all(users.map(async user => {
    const profile = await getOrCreateProfile(user.id);
    return { ...user, phone: profile.phone, city: profile.city, profileEmail: profile.profileEmail, fullName: profile.fullName, currency: profile.currency };
  }));
}

export async function adminSetUserBlocked(userId: number, blocked: boolean) {
  const user = await userById(userId); if (!user) throw new Error("Utilisateur introuvable");
  await db().collection(COLLECTIONS.users).doc(user.openId).update({ isBlocked: blocked, updatedAt: new Date() });
}

export async function adminSetUserRole(userId: number, role: Role) {
  const user = await userById(userId); if (!user) throw new Error("Utilisateur introuvable");
  await db().collection(COLLECTIONS.users).doc(user.openId).update({ role, updatedAt: new Date() });
}

export async function adminRequestPasswordReset(userId: number) {
  const user = await userById(userId); if (!user) throw new Error("Utilisateur introuvable");
  await db().collection(COLLECTIONS.users).doc(user.openId).update({ passwordResetRequestedAt: new Date(), updatedAt: new Date() });
}

export async function adminGetStats() {
  const [users, courses, comments, ads] = await Promise.all([
    db().collection(COLLECTIONS.users).get(), db().collection(COLLECTIONS.courses).get(), db().collection(COLLECTIONS.courseComments).get(), db().collection(COLLECTIONS.ads).get(),
  ]);
  return {
    totalUsers: users.size,
    totalCourses: courses.docs.map(snapshot => read<Course>(snapshot)).filter(item => item.isPublished).length,
    pendingComments: comments.docs.map(snapshot => read<CourseComment>(snapshot)).filter(item => !item.isApproved).length,
    activeAds: ads.docs.map(snapshot => read<Ad>(snapshot)).filter(item => item.isActive).length,
  };
}

export async function listAds(activeOnly = false): Promise<Ad[]> {
  const snapshots = await db().collection(COLLECTIONS.ads).get();
  const rows = snapshots.docs.map(snapshot => read<Ad>(snapshot)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return activeOnly ? rows.filter(item => item.isActive) : rows;
}

export async function createAd(data: Omit<Ad, "id" | "createdAt" | "updatedAt" | "clickCount">) { await createWithId<Ad>(COLLECTIONS.ads, { ...data, imageUrl: data.imageUrl ?? null, linkUrl: data.linkUrl ?? null, startsAt: data.startsAt ?? null, endsAt: data.endsAt ?? null, clickCount: 0, createdAt: new Date(), updatedAt: new Date() }); }
export async function updateAd(id: number, data: Partial<Omit<Ad, "id" | "createdAt">>) { await updateById(COLLECTIONS.ads, id, data); }
export async function deleteAd(id: number) { await deleteById(COLLECTIONS.ads, id); }
export async function incrementAdClick(id: number) { const item = await findById<Ad>(COLLECTIONS.ads, id); if (item) await updateById(COLLECTIONS.ads, id, { clickCount: item.clickCount + 1 }); }

export async function listAdminNotifications() {
  const snapshots = await db().collection(COLLECTIONS.adminNotifications).get();
  return snapshots.docs.map(snapshot => read<AdminNotification>(snapshot)).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()).slice(0, 50);
}

export async function createAdminNotification(data: Omit<AdminNotification, "id">) { await createWithId<AdminNotification>(COLLECTIONS.adminNotifications, data); }
export async function adminCreateCourse(data: Omit<Course, "id" | "createdAt" | "updatedAt">) { return createCourse(data); }
export async function adminUpdateCourse(id: number, data: Partial<Omit<Course, "id" | "createdAt">>) { return updateCourse(id, data); }
export async function adminDeleteCourse(id: number) { return deleteCourse(id); }
export async function adminListCourses() { return getAllCourses(); }

export async function adminListComments() {
  const snapshots = await db().collection(COLLECTIONS.courseComments).get();
  const comments = snapshots.docs.map(snapshot => read<CourseComment>(snapshot)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return Promise.all(comments.map(async item => {
    const [user, course] = await Promise.all([userById(item.userId), getCourseById(item.courseId)]);
    return { ...item, userName: user?.name ?? "Utilisateur", courseTitle: course?.title ?? "Cours supprimé" };
  }));
}

export async function adminCreateCourseCategory(data: Omit<CourseCategory, "id" | "createdAt">) { return createCourseCategory(data); }
export async function adminUpdateCourseCategory(id: number, data: Partial<Omit<CourseCategory, "id" | "createdAt">>) { await updateById(COLLECTIONS.courseCategories, id, data); }
export async function adminDeleteCourseCategory(id: number) { await deleteById(COLLECTIONS.courseCategories, id); }
