-- Add updated_at column to user_stats for offline sync conflict resolution
ALTER TABLE `user_stats` ADD COLUMN `updated_at` TEXT;
