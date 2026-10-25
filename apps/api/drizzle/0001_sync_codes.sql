ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sync_code_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_sync_code_hash_unique" ON "users" USING btree ("sync_code_hash");