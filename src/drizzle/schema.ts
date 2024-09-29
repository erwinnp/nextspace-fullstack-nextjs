import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const discussionsTable = pgTable("discussions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  title: text("title").notNull(),
  description: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const repliesTable = pgTable("replies", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  discussionId: serial("discussion_id"),
  description: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const usersRelation = relations(usersTable, ({ many }) => ({
  discussions: many(discussionsTable),
  replies: many(repliesTable),
}));

export const discussionsRelations = relations(
  discussionsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [discussionsTable.userId],
      references: [usersTable.id],
    }),
    replies: many(repliesTable),
  })
);

export const repliesRelations = relations(repliesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [repliesTable.userId],
    references: [usersTable.id],
  }),
  discussion: one(discussionsTable, {
    fields: [repliesTable.discussionId],
    references: [discussionsTable.id],
  }),
}));
