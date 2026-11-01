import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { SignUpForm } from "#/components/Auth/SignUpForm";
import { getSession } from "#/lib/auth-session";

export const Route = createFileRoute("/signup")({
	beforeLoad: async () => {
		if (await getSession()) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<div className="p-8 space-y-4">
			<h1 className="text-2xl font-bold text-center">Create an account</h1>
			<SignUpForm />
			<p className="text-center text-sm">
				Already have an account?{" "}
				<Link to="/login" className="text-indigo-600 underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}
