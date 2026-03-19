CREATE TABLE "inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"imei" text NOT NULL,
	"order_id" integer,
	"inspector_id" integer,
	"phone_specs" jsonb,
	"grade" text,
	"defects" text[] DEFAULT '{}',
	"notes" text,
	"images" text[] DEFAULT '{}',
	"status" text DEFAULT 'scanning' NOT NULL,
	"scanned_at" timestamp,
	"photographed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"expected_quantity" integer NOT NULL,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'inspector' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;