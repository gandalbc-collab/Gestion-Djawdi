import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  serial,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const currencyEnum = pgEnum("currency", ["GNF", "CFA", "EUR", "USD"]);
export const adPositionEnum = pgEnum("ad_position", ["dashboard_top", "dashboard_bottom", "sidebar", "learn_page"]);

// ─── Core user table (auth) ───────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  passwordResetRequestedAt: timestamp("password_reset_requested_at"),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── User profile (preferences) ──────────────────────────────────────────────
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  fullName: varchar("full_name", { length: 128 }),
  currency: currencyEnum("currency").default("GNF").notNull(),
  phone: varchar("phone", { length: 32 }),
  profileEmail: varchar("profile_email", { length: 320 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type UserProfile = typeof userProfiles.$inferSelect;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 8 }).notNull().default("📌"),
  description: varchar("description", { length: 128 }),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Category = typeof categories.$inferSelect;

// ─── Revenues ─────────────────────────────────────────────────────────────────
export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: varchar("description", { length: 128 }).notNull().default("Revenu"),
  month: varchar("month", { length: 7 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Revenue = typeof revenues.$inferSelect;

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  month: varchar("month", { length: 7 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Budget = typeof budgets.$inferSelect;

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: varchar("description", { length: 128 }).notNull().default("Dépense"),
  month: varchar("month", { length: 7 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Expense = typeof expenses.$inferSelect;

// ─── Scheduled payments ───────────────────────────────────────────────────────
export const scheduledPayments = pgTable("scheduled_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  description: varchar("description", { length: 128 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  dayOfMonth: integer("day_of_month").notNull().default(1),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ScheduledPayment = typeof scheduledPayments.$inferSelect;

// ─── Learning module ──────────────────────────────────────────────────────────
export const courseCategories = pgTable("course_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 8 }).notNull().default("📚"),
  color: varchar("color", { length: 32 }).notNull().default("emerald"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CourseCategory = typeof courseCategories.$inferSelect;

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id"),
  title: varchar("title", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  excerpt: varchar("excerpt", { length: 256 }),
  content: text("content").notNull().default(""),
  coverEmoji: varchar("cover_emoji", { length: 8 }).notNull().default("📖"),
  readingMinutes: integer("reading_minutes").notNull().default(5),
  isPublished: boolean("is_published").default(false).notNull(),
  allowLikes: boolean("allow_likes").default(true).notNull(),
  allowRatings: boolean("allow_ratings").default(true).notNull(),
  allowComments: boolean("allow_comments").default(true).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Course = typeof courses.$inferSelect;

export const courseProgress = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});
export type CourseProgress = typeof courseProgress.$inferSelect;

export const courseLikes = pgTable("course_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type CourseLike = typeof courseLikes.$inferSelect;

export const courseRatings = pgTable("course_ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type CourseRating = typeof courseRatings.$inferSelect;

export const courseComments = pgTable("course_comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  content: text("content").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type CourseComment = typeof courseComments.$inferSelect;

// ─── Learning settings ────────────────────────────────────────────────────────
export const learningSettings = pgTable("learning_settings", {
  id: serial("id").primaryKey(),
  youtubeChannelUrl: varchar("youtube_channel_url", { length: 256 }),
  showYoutubeButton: boolean("show_youtube_button").default(true).notNull(),
  allowLikes: boolean("allow_likes").default(true).notNull(),
  allowRatings: boolean("allow_ratings").default(true).notNull(),
  allowComments: boolean("allow_comments").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type LearningSettings = typeof learningSettings.$inferSelect;

// ─── Contact page ─────────────────────────────────────────────────────────────
export const contactPage = pgTable("contact_page", {
  id: serial("id").primaryKey(),
  displayName: varchar("display_name", { length: 128 }).default("Cim Bailo").notNull(),
  fullName: varchar("full_name", { length: 256 }).default("Cissé Mamadou Bailo").notNull(),
  title: varchar("title", { length: 256 }).default("Coach en gestion financière").notNull(),
  bio: text("bio"),
  photoUrl: varchar("photo_url", { length: 512 }),
  email: varchar("email", { length: 320 }).default("djawdi@gmail.com"),
  phone: varchar("phone", { length: 64 }).default("+1 267 206 44 17"),
  facebook: varchar("facebook", { length: 256 }).default("https://facebook.com/Cimbailo"),
  youtube: varchar("youtube", { length: 256 }),
  tiktok: varchar("tiktok", { length: 256 }),
  appDescription: text("app_description"),
  howItWorks: text("how_it_works"),
  howToUse: text("how_to_use"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type ContactPage = typeof contactPage.$inferSelect;

// ─── Advertisements ───────────────────────────────────────────────────────────
export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  imageUrl: varchar("image_url", { length: 512 }),
  linkUrl: varchar("link_url", { length: 512 }),
  position: adPositionEnum("position").default("dashboard_top").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  clickCount: integer("click_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Ad = typeof ads.$inferSelect;

// ─── Admin notifications ──────────────────────────────────────────────────────
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  sentBy: integer("sent_by").notNull(),
  recipientCount: integer("recipient_count").default(0).notNull(),
});
export type AdminNotification = typeof adminNotifications.$inferSelect;
