import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

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
