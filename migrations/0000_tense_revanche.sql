CREATE TABLE `puzzles` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle` text NOT NULL,
	`solution` text NOT NULL,
	`difficulty_score` real NOT NULL,
	`difficulty_label` text NOT NULL,
	`techniques_required` text NOT NULL,
	`clue_count` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`settings` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text,
	`user_id` text,
	`puzzle_id` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`time_seconds` integer,
	`assists_used` text,
	`notes_snapshot` text,
	`board_state` text,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action
);
