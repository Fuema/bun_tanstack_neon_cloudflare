import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

// Reads the Better Auth session from the request cookies on the server.
// Returns null when the visitor is signed out.
export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		return auth.api.getSession({ headers: getRequestHeaders() });
	},
);
