-- Add manufacturer and model columns to computers
ALTER TABLE `computers` ADD COLUMN `manufacturer` text;
ALTER TABLE `computers` ADD COLUMN `model` text;

--> statement-breakpoint
-- Add manufacturer and model columns to monitors
ALTER TABLE `monitors` ADD COLUMN `manufacturer` text;
ALTER TABLE `monitors` ADD COLUMN `model` text;

--> statement-breakpoint
-- Add manufacturer and model columns to notebooks
ALTER TABLE `notebooks` ADD COLUMN `manufacturer` text;
ALTER TABLE `notebooks` ADD COLUMN `model` text;

--> statement-breakpoint
-- Add manufacturer and model columns to printers
ALTER TABLE `printers` ADD COLUMN `manufacturer` text;
ALTER TABLE `printers` ADD COLUMN `model` text;
