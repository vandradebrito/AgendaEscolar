import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const loginHistoryTable = pgTable("login_history", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  loggedInAt: timestamp("logged_in_at").defaultNow().notNull(),
});

export type LoginHistory = typeof loginHistoryTable.$inferSelect;
