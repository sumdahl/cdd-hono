CREATE TABLE "todos" (
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false NOT NULL
);
