ALTER TABLE `users` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(100) NOT NULL;