import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppHeader } from "#/components/Workspace/AppHeader";
import { InvitationBanner } from "#/components/Workspace/InvitationBanner";
import { getSession } from "#/lib/auth-session";
import { getWorkspaceAccess } from "#/lib/authz";

// Guard for every page under _authed/. The session check runs on the server, so
// signed-out visitors are redirected before any protected page renders.
export const Route = createFileRoute("/_authed")({
	beforeLoad: async ({ location }) => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
		// Role and permissions in the active workspace, for showing/hiding UI
		const access = await getWorkspaceAccess();
		return { session, access };
	},
	component: AuthedLayout,
});

function AuthedLayout() {
	const { access } = Route.useRouteContext();
	return (
		<div className="min-h-svh bg-muted/40">
			<AppHeader access={access} />
			<InvitationBanner />
			<main>
				<Outlet />
			</main>
		</div>
	);
}
