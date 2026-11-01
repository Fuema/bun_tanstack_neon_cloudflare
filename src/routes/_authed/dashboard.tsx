import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SignOutButton } from "#/components/Auth/SignOutButton";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

// Protected by the _authed layout guard
export const Route = createFileRoute("/_authed/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { user } = Route.useRouteContext().session;

	return (
		<div className="mx-auto max-w-3xl space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<SignOutButton />
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{user.name}</CardTitle>
					<CardDescription className="break-all">{user.email}</CardDescription>
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
						<ShieldCheck /> Security settings
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
