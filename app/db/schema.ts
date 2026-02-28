import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Better Auth tables
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified").notNull().default(0),
  image: text("image"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: text("accessTokenExpiresAt"),
  refreshTokenExpiresAt: text("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const passkey = sqliteTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("publicKey").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credentialID").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("deviceType").notNull(),
  backedUp: integer("backedUp").notNull().default(0),
  transports: text("transports"),
  createdAt: text("createdAt").notNull(),
  aaguid: text("aaguid"),
});

// App tables
export const puzzles = sqliteTable("puzzles", {
  id: text("id").primaryKey(),
  puzzle: text("puzzle").notNull(), // 81-char string, dots for blanks
  solution: text("solution").notNull(), // 81-char string
  difficultyScore: real("difficulty_score").notNull(),
  difficultyLabel: text("difficulty_label").notNull(),
  techniquesRequired: text("techniques_required").notNull(), // JSON array
  clueCount: integer("clue_count").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userStats = sqliteTable("user_stats", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id"), // anonymous tracking (optional)
  userId: text("user_id"), // FK to better-auth user table
  puzzleId: text("puzzle_id")
    .notNull()
    .references(() => puzzles.id),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  timeSeconds: integer("time_seconds"),
  assistsUsed: text("assists_used"), // JSON
  notesSnapshot: text("notes_snapshot"), // JSON for resume
  boardState: text("board_state"), // 81-char current state
});

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  settings: text("settings").notNull(), // JSON
});
