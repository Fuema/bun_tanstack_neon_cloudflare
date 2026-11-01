import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, ShieldCheck, Users } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { RoleBadge } from "#/components/Workspace/RoleBadge";
import { ROLE_LABELS, type WorkspaceRole } from "#/lib/permissions";

// Protected by the _authed layout guard
export const Route = createFileRoute("/_authed/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { session, access } = Route.useRouteContext();
	const { user } = session;

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6">
			<h1 className="text-2xl font-bold">Dashboard</h1>
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{user.name}</CardTitle>
						<CardDescription className="break-all">
							{user.email}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap items-center gap-2">
						<Badge variant={user.emailVerified ? "default" : "secondary"}>
							{user.emailVerified ? "Email verified" : "Email not verified"}
						</Badge>
						<Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
							{user.twoFactorEnabled ? "2FA on" : "2FA off"}
						</Badge>
						<Link
							to="/account/security"
							className={buttonVariants({
								variant: "outline",
								size: "sm",
								className: "ml-auto",
							})}
						>
							<ShieldCheck /> Security
						</Link>
					</CardContent>
				</Card>

				{access ? (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								{access.workspace?.name ?? "Workspace"}{" "}
								<RoleBadge role={access.role} />
							</CardTitle>
							<CardDescription>
								{ROLE_LABELS[access.role as WorkspaceRole]?.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-2">
							<Link to="/projects" className={buttonVariants({ size: "sm" })}>
								<FolderKanban /> Projects
							</Link>
							<Link
								to="/workspace/members"
								className={buttonVariants({ variant: "outline", size: "sm" })}
							>
								<Users /> Members
							</Link>
						</CardContent>
					</Card>
				) : null}
			</div>
		</div>
	);
}
