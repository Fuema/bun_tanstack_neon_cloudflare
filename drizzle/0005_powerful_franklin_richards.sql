CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"type" text NOT NULL,
	"subject" text NOT NULL,
	"notes" text,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"all_day" boolean DEFAULT false NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"owner_id" text,
	"customer_id" text,
	"order_id" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"position" double precision NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignee_id" text,
	"due_at" timestamp,
	"all_day" boolean DEFAULT true NOT NULL,
	"customer_id" text,
	"order_id" text,
	"completed_at" timestamp,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_order_id_sales_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sales_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_tenant_starts_idx" ON "activity" USING btree ("tenant_id","starts_at");--> statement-breakpoint
CREATE INDEX "activity_tenant_customer_idx" ON "activity" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "task_tenant_status_position_idx" ON "task" USING btree ("tenant_id","status","position");--> statement-breakpoint
CREATE INDEX "task_tenant_due_idx" ON "task" USING btree ("tenant_id","due_at");--> statement-breakpoint
CREATE INDEX "task_tenant_assignee_idx" ON "task" USING btree ("tenant_id","assignee_id");