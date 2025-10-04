import { relations } from "drizzle-orm";
import {
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgTableCreator,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `blackjack_${name}`);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    withTimezone: true,
  }).defaultNow(),
  image: varchar("image", { length: 255 }),
  currentBalance: integer("currentBalance").notNull().default(500),
  totalWagered: integer("totalWagered").notNull().default(0),
  totalWins: integer("totalWins").notNull().default(0),
  totalLosses: integer("totalLosses").notNull().default(0),
  totalPushes: integer("totalPushes").notNull().default(0),
  totalChipsBought: integer("totalChipsBought").notNull().default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts, { relationName: "user" }),
  sessions: many(sessions, { relationName: "user" }),
  transactions: many(transactions, { relationName: "user" }),
  games: many(games, { relationName: "user" }),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
    userIdx: index("account_user_id_idx").on(table.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
    relationName: "user",
  }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: index("t_user_id_idx").on(table.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
    relationName: "user",
  }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

export const transactions = createTable(
  "transaction",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    amount: integer("amount").notNull(),
    balanceBefore: integer("balanceBefore").notNull(),
    balanceAfter: integer("balanceAfter").notNull(),
    gameId: varchar("gameId", { length: 255 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("transaction_user_id_idx").on(table.userId),
    createdIdx: index("transaction_created_at_idx").on(table.createdAt),
    gameIdx: index("transaction_game_id_idx").on(table.gameId),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
    relationName: "user",
  }),
}));

export const games = createTable(
  "game",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    betAmount: integer("betAmount").notNull(),
    playerHand: jsonb("playerHand").notNull(),
    dealerHand: jsonb("dealerHand").notNull(),
    deck: jsonb("deck").notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    result: varchar("result", { length: 50 }),
    playerScore: integer("playerScore"),
    dealerScore: integer("dealerScore"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    lastActivityAt: timestamp("lastActivityAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastAction: varchar("lastAction", { length: 50 }),
  },
  (table) => ({
    userIdx: index("game_user_id_idx").on(table.userId),
    statusIdx: index("game_status_idx").on(table.status),
    createdIdx: index("game_created_at_idx").on(table.createdAt),
    lastActivityIdx: index("game_last_activity_idx").on(table.lastActivityAt),
    userStatusIdx: index("game_user_status_idx").on(table.userId, table.status),
  }),
);

export const gamesRelations = relations(games, ({ one }) => ({
  user: one(users, {
    fields: [games.userId],
    references: [users.id],
    relationName: "user",
  }),
}));
