ALTER TABLE "analysis_history" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "analysis_history_user_created_at_idx" ON "analysis_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "analysis_history_user_id_idx" ON "analysis_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analysis_history_created_at_idx" ON "analysis_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analysis_history_analysis_type_idx" ON "analysis_history" USING btree ("analysis_type");--> statement-breakpoint
CREATE INDEX "analysis_history_user_analysis_type_idx" ON "analysis_history" USING btree ("user_id","analysis_type");