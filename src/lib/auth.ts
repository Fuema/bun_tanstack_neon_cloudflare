import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "../db/index"; // Points to your Neon-HTTP database file (not the legacy src/db.ts)
import * as schema from "../db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),
	emailAndPassword: {
		enabled: true, // Enables standard registration & login flows natively
	},
	plugins: [tanstackStartCookies()], // Sets session cookies from TanStack Start server functions
});
