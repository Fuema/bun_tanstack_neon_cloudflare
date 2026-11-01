import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "#/lib/auth-session";

// Guard for every page under _authed/. The session check runs on the server, so
// signed-out visitors are redirected before any protected page renders.
export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ location }) => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
		return { session };
	},
	component: Outlet,
});
