-- Add userId to computers table for direct user assignment
ALTER TABLE `computers` ADD COLUMN `user_id` integer REFERENCES `users`(`id`) ON DELETE SET NULL;

--> statement-breakpoint
-- Add userId to notebooks table for direct user assignment
ALTER TABLE `notebooks` ADD COLUMN `user_id` integer REFERENCES `users`(`id`) ON DELETE SET NULL;

--> statement-breakpoint
-- Add computerId and notebookId to printers table for device assignment
ALTER TABLE `printers` ADD COLUMN `computer_id` integer REFERENCES `computers`(`id`) ON DELETE SET NULL;

--> statement-breakpoint
ALTER TABLE `printers` ADD COLUMN `notebook_id` integer REFERENCES `notebooks`(`id`) ON DELETE SET NULL;
