import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { SignInForm } from "#/components/Auth/SignInForm";
import { getSession } from "#/lib/auth-session";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		if (await getSession()) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	return (
		<div className="p-8 space-y-4">
			<h1 className="text-2xl font-bold text-center">Sign in</h1>
			<SignInForm />
			<p className="text-center text-sm">
				No account yet?{" "}
				<Link to="/signup" className="text-indigo-600 underline">
					Sign up
				</Link>
			</p>
		</div>
	);
}
