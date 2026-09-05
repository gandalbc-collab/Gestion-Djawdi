import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addExpense,
  addRevenue,
  createCategory,
  createScheduledPayment,
  deleteExpense,
  deleteRevenue,
  deleteScheduledPayment,
  ensureDefaultCategories,
  executeScheduledPayment,
  getBudgets,
  getCaisseData,
  getCategories,
  getExpenses,
  getOrCreateProfile,
  getRevenues,
  getScheduledPayments,
  completeRegistrationProfile,
  getSynthesisData,
  toggleScheduledPayment,
  updateProfile,
  upsertBudget,
} from "./db";
import {
  getLearningSettings,
  updateLearningSettings,
  getCourseCategories,
  createCourseCategory,
  getPublishedCourses,
  getAllCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  getUserCourseProgress,
  markCourseComplete,
  unmarkCourseComplete,
  toggleCourseLike,
  getCourseLikesCount,
  getUserLikedCourses,
  upsertCourseRating,
  getCourseAverageRating,
  getUserCourseRating,
  addCourseComment,
  getApprovedComments,
  getAllComments,
  approveComment,
  deleteComment,
} from "./db";
import { getContactPage, updateContactPage } from "./db";

import {
  adminListUsers,
  adminSetUserBlocked,
  adminSetUserRole,
  adminRequestPasswordReset,
  adminGetStats,
  listAds,
  createAd,
  updateAd,
  deleteAd,
  incrementAdClick,
  listAdminNotifications,
  createAdminNotification,
  adminListCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminListComments,
  adminCreateCourseCategory,
  adminUpdateCourseCategory,
  adminDeleteCourseCategory,
} from "./db";
import { getFirebaseAdminAuth } from "./_core/firebaseAdmin";
// ─── Shared validators ────────────────────────────────────────────────────────
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM requis");
const amountSchema = z.number().positive().max(999_999_999);
const currencySchema = z.enum(["GNF", "CFA", "EUR", "USD"]);
export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Le nom complet est requis").max(128),
  phone: z.string().trim().min(7, "Le numéro de téléphone est requis").max(32).regex(/^[0-9+().\s-]+$/, "Numéro de téléphone invalide"),
  city: z.string().trim().min(2, "La ville de résidence est requise").max(120),
});


// ─── Admin router ─────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

const adminRouter = router({
  // Stats
  stats: adminProcedure.query(() => adminGetStats()),

  // Users management
  users: router({
    list: adminProcedure.query(() => adminListUsers()),
    block: adminProcedure
      .input(z.object({ userId: z.number(), blocked: z.boolean() }))
      .mutation(({ input }) => adminSetUserBlocked(input.userId, input.blocked)),
    setRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(({ input }) => adminSetUserRole(input.userId, input.role)),
    requestPasswordReset: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(({ input }) => adminRequestPasswordReset(input.userId)),
  }),

  // Ads management
  ads: router({
    list: adminProcedure.query(() => listAds()),
    listActive: publicProcedure.query(() => listAds(true)),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(128),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        position: z.enum(["dashboard_top", "dashboard_bottom", "sidebar", "learn_page"]).default("dashboard_top"),
        isActive: z.boolean().default(true),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
      }))
      .mutation(({ input }) => createAd(input as any)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(128).optional(),
        imageUrl: z.string().optional(),
        linkUrl: z.string().optional(),
        position: z.enum(["dashboard_top", "dashboard_bottom", "sidebar", "learn_page"]).optional(),
        isActive: z.boolean().optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateAd(id, data as any); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteAd(input.id)),
    click: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => incrementAdClick(input.id)),
  }),

  // Notifications
  notifications: router({
    list: adminProcedure.query(() => listAdminNotifications()),
    send: adminProcedure
      .input(z.object({ title: z.string().min(1).max(128), message: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const allUsers = await adminListUsers();
        await createAdminNotification({
          title: input.title,
          message: input.message,
          sentAt: new Date(),
          sentBy: ctx.user.id,
          recipientCount: allUsers.length,
        });
        return { sent: allUsers.length };
      }),
  }),

  // Courses admin
  courses: router({
    list: adminProcedure.query(() => adminListCourses()),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(128),
        slug: z.string().min(1).max(128),
        excerpt: z.string().max(256).optional(),
        content: z.string().default(""),
        coverEmoji: z.string().default("📖"),
        readingMinutes: z.number().int().min(1).default(5),
        categoryId: z.number().optional(),
        isPublished: z.boolean().default(false),
        allowLikes: z.boolean().default(true),
        allowRatings: z.boolean().default(true),
        allowComments: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      }))
      .mutation(({ input }) => adminCreateCourse(input as any)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(128).optional(),
        slug: z.string().min(1).max(128).optional(),
        excerpt: z.string().max(256).optional(),
        content: z.string().optional(),
        coverEmoji: z.string().optional(),
        readingMinutes: z.number().int().min(1).optional(),
        categoryId: z.number().optional(),
        isPublished: z.boolean().optional(),
        allowLikes: z.boolean().optional(),
        allowRatings: z.boolean().optional(),
        allowComments: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return adminUpdateCourse(id, data as any); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => adminDeleteCourse(input.id)),
  }),

  // Comments moderation
  comments: router({
    list: adminProcedure.query(() => adminListComments()),
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => approveComment(input.id)),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteComment(input.id)),
  }),

  // Course categories admin
  courseCategories: router({
    create: adminProcedure
      .input(z.object({ name: z.string().min(1).max(64), icon: z.string().default("📚"), color: z.string().default("emerald"), sortOrder: z.number().int().default(0) }))
      .mutation(({ input }) => adminCreateCourseCategory(input)),
    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), icon: z.string().optional(), color: z.string().optional(), sortOrder: z.number().int().optional() }))
      .mutation(({ input }) => { const { id, ...data } = input; return adminUpdateCourseCategory(id, data); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => adminDeleteCourseCategory(input.id)),
  }),
  // Contact page admin
  contact: router({
    get: adminProcedure.query(() => getContactPage()),
    update: adminProcedure
      .input(z.object({
        displayName: z.string().min(1).max(128).optional(),
        fullName: z.string().min(1).max(256).optional(),
        title: z.string().min(1).max(256).optional(),
        bio: z.string().optional(),
        photoUrl: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        facebook: z.string().optional(),
        youtube: z.string().optional(),
        tiktok: z.string().optional(),
        appDescription: z.string().optional(),
        howItWorks: z.string().optional(),
        howToUse: z.string().optional(),
      }))
      .mutation(({ input }) => updateContactPage(input)),
  }),
  // Global settings admin
  settings: router({
    get: adminProcedure.query(() => getLearningSettings()),
    update: adminProcedure
      .input(z.object({
        youtubeUrl: z.string().optional(),
        allowLikes: z.boolean().optional(),
        allowRatings: z.boolean().optional(),
        allowComments: z.boolean().optional(),
      }))
      .mutation(({ input }) => updateLearningSettings(input)),
  }),
});



export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      // Firebase manages its own client session through firebase/auth signOut().
      // This endpoint is kept for compatibility with the useAuth() hook.
      return { success: true } as const;
    }),
  }),

  registration: router({
    completeProfile: publicProcedure
      .input(registrationSchema)
      .mutation(async ({ ctx, input }) => {
        const header = ctx.req.headers.authorization;
        if (typeof header !== "string" || !header.startsWith("Bearer ")) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Connexion requise pour finaliser l'inscription" });
        }
        const decoded = await getFirebaseAdminAuth().verifyIdToken(header.slice(7), true);
        if (!decoded.uid || !decoded.email) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Identité Firebase invalide" });
        }
        await completeRegistrationProfile({
          openId: decoded.uid,
          email: decoded.email,
          fullName: input.fullName,
          phone: input.phone,
          city: input.city,
        });
        return { success: true } as const;
      }),
  }),

  // ─── Profile ───────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getOrCreateProfile(ctx.user.id)),
    update: protectedProcedure
      .input(z.object({
        fullName: z.string().min(1).max(128).optional(),
        currency: currencySchema.optional(),
        phone: z.string().max(32).nullable().optional(),
        city: z.string().trim().min(2).max(120).nullable().optional(),
        profileEmail: z.string().email().max(320).nullable().optional(),
      }))
      .mutation(({ ctx, input }) => updateProfile(ctx.user.id, input)),
  }),

  // ─── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return ensureDefaultCategories(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(64),
        icon: z.string().max(8).optional(),
        description: z.string().max(128).optional(),
      }))
      .mutation(({ ctx, input }) => createCategory(ctx.user.id, input)),
  }),

  // ─── Revenues ──────────────────────────────────────────────────────────────
  revenues: router({
    list: protectedProcedure
      .input(z.object({ month: monthSchema }))
      .query(({ ctx, input }) => getRevenues(ctx.user.id, input.month)),
    add: protectedProcedure
      .input(z.object({
        amount: amountSchema,
        description: z.string().min(1).max(128),
        month: monthSchema,
      }))
      .mutation(({ ctx, input }) =>
        addRevenue(ctx.user.id, { amount: input.amount.toString(), description: input.description, month: input.month })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteRevenue(ctx.user.id, input.id)),
  }),

  // ─── Budgets ───────────────────────────────────────────────────────────────
  budgets: router({
    list: protectedProcedure
      .input(z.object({ month: monthSchema }))
      .query(({ ctx, input }) => getBudgets(ctx.user.id, input.month)),
    upsert: protectedProcedure
      .input(z.object({
        categoryId: z.number().int().positive(),
        amount: z.number().min(0).max(999_999_999),
        month: monthSchema,
      }))
      .mutation(({ ctx, input }) =>
        upsertBudget(ctx.user.id, input.categoryId, input.amount.toString(), input.month)
      ),
  }),

  // ─── Expenses ──────────────────────────────────────────────────────────────
  expenses: router({
    list: protectedProcedure
      .input(z.object({ month: monthSchema }))
      .query(({ ctx, input }) => getExpenses(ctx.user.id, input.month)),
    add: protectedProcedure
      .input(z.object({
        categoryId: z.number().int().positive(),
        amount: amountSchema,
        description: z.string().min(1).max(128),
        month: monthSchema,
      }))
      .mutation(({ ctx, input }) =>
        addExpense(ctx.user.id, { categoryId: input.categoryId, amount: input.amount.toString(), description: input.description, month: input.month })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteExpense(ctx.user.id, input.id)),
  }),

  // ─── Caisse ────────────────────────────────────────────────────────────────
  caisse: router({
    get: protectedProcedure.query(({ ctx }) => getCaisseData(ctx.user.id)),
  }),

  // ─── Synthesis ─────────────────────────────────────────────────────────────
  synthesis: router({
    history: protectedProcedure.query(({ ctx }) => getSynthesisData(ctx.user.id)),
  }),

  // ─── Scheduled Payments ────────────────────────────────────────────────────
  scheduledPayments: router({
    list: protectedProcedure.query(({ ctx }) => getScheduledPayments(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number().int().positive(),
        description: z.string().min(1).max(128),
        amount: amountSchema,
        dayOfMonth: z.number().int().min(1).max(31),
      }))
      .mutation(({ ctx, input }) =>
        createScheduledPayment(ctx.user.id, { ...input, amount: input.amount.toString() })
      ),
    toggle: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => toggleScheduledPayment(ctx.user.id, input.id)),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteScheduledPayment(ctx.user.id, input.id)),
    execute: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), month: monthSchema }))
      .mutation(async ({ ctx, input }) => {
        try {
          await executeScheduledPayment(ctx.user.id, input.id, input.month);
          return { success: true };
        } catch (err: unknown) {
          if (err instanceof Error && err.message === "DUPLICATE") {
            throw new TRPCError({ code: "CONFLICT", message: "Cette dépense a déjà été enregistrée pour ce mois." });
          }
          throw err;
        }
      }),
  }),

  // ─── Learning module ───────────────────────────────────────────────────────
  learning: router({
    settings: publicProcedure.query(() => getLearningSettings()),
    updateSettings: protectedProcedure
      .input(z.object({
        youtubeChannelUrl: z.string().url().max(256).nullable().optional(),
        showYoutubeButton: z.boolean().optional(),
        allowLikes: z.boolean().optional(),
        allowRatings: z.boolean().optional(),
        allowComments: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return updateLearningSettings(input);
      }),
    categories: publicProcedure.query(() => getCourseCategories()),
    createCategory: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(64), icon: z.string().max(8).optional(), color: z.string().max(32).optional() }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return createCourseCategory(input);
      }),
    list: publicProcedure.query(() => getPublishedCourses()),
    listAll: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllCourses();
    }),
    get: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getCourseBySlug(input.slug)),
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number().int().positive().optional(),
        title: z.string().min(1).max(128),
        slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
        excerpt: z.string().max(256).optional(),
        content: z.string(),
        coverEmoji: z.string().max(8).optional(),
        readingMinutes: z.number().int().min(1).max(120).optional(),
        isPublished: z.boolean().optional(),
        allowLikes: z.boolean().optional(),
        allowRatings: z.boolean().optional(),
        allowComments: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return createCourse({ ...input, categoryId: input.categoryId ?? null, excerpt: input.excerpt ?? null, content: input.content ?? "", coverEmoji: input.coverEmoji ?? "📖", readingMinutes: input.readingMinutes ?? 5, isPublished: input.isPublished ?? false, allowLikes: input.allowLikes ?? true, allowRatings: input.allowRatings ?? true, allowComments: input.allowComments ?? true, sortOrder: input.sortOrder ?? 0 });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(128).optional(),
        slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/).optional(),
        excerpt: z.string().max(256).optional(),
        content: z.string().optional(),
        coverEmoji: z.string().max(8).optional(),
        readingMinutes: z.number().int().min(1).max(120).optional(),
        isPublished: z.boolean().optional(),
        allowLikes: z.boolean().optional(),
        allowRatings: z.boolean().optional(),
        allowComments: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        categoryId: z.number().int().positive().nullable().optional(),
      }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        return updateCourse(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return deleteCourse(input.id);
      }),
    myProgress: protectedProcedure.query(({ ctx }) => getUserCourseProgress(ctx.user.id)),
    markComplete: protectedProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => markCourseComplete(ctx.user.id, input.courseId)),
    unmarkComplete: protectedProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => unmarkCourseComplete(ctx.user.id, input.courseId)),
    toggleLike: protectedProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => toggleCourseLike(ctx.user.id, input.courseId)),
    likesCount: publicProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .query(({ input }) => getCourseLikesCount(input.courseId)),
    myLikes: protectedProcedure.query(({ ctx }) => getUserLikedCourses(ctx.user.id)),
    rate: protectedProcedure
      .input(z.object({ courseId: z.number().int().positive(), rating: z.number().int().min(1).max(5) }))
      .mutation(({ ctx, input }) => upsertCourseRating(ctx.user.id, input.courseId, input.rating)),
    avgRating: publicProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .query(({ input }) => getCourseAverageRating(input.courseId)),
    myRating: protectedProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .query(({ ctx, input }) => getUserCourseRating(ctx.user.id, input.courseId)),
    comment: protectedProcedure
      .input(z.object({ courseId: z.number().int().positive(), content: z.string().min(1).max(1000) }))
      .mutation(({ ctx, input }) => addCourseComment(ctx.user.id, input.courseId, input.content)),
    comments: publicProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .query(({ input }) => getApprovedComments(input.courseId)),
    allComments: protectedProcedure
      .input(z.object({ courseId: z.number().int().positive() }))
      .query(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getAllComments(input.courseId);
      }),
    approveComment: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return approveComment(input.id);
      }),
    deleteComment: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return deleteComment(input.id);
      }),
  }),
  contact: router({
    get: publicProcedure.query(() => getContactPage()),
    update: protectedProcedure
      .input(
        z.object({
          displayName: z.string().min(1).max(128).optional(),
          fullName: z.string().min(1).max(256).optional(),
          title: z.string().min(1).max(256).optional(),
          bio: z.string().optional(),
          photoUrl: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          facebook: z.string().optional(),
          youtube: z.string().optional(),
          tiktok: z.string().optional(),
          appDescription: z.string().optional(),
          howItWorks: z.string().optional(),
          howToUse: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return updateContactPage(input);
      }),
  }),
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
