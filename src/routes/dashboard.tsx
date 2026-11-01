import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignOutButton } from "#/components/Auth/SignOutButton";
import { getSession } from "#/lib/auth-session";

export const Route = createFileRoute("/dashboard")({
	// The session check runs on the server, so signed-out visitors never see this page
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { user: session.user };
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { user } = Route.useRouteContext();

	return (
		<div className="p-8 space-y-4">
			<h1 className="text-2xl font-bold">Dashboard</h1>
			<p>
				Signed in as <strong>{user.name}</strong> ({user.email})
			</p>
			<SignOutButton />
		</div>
	);
}
