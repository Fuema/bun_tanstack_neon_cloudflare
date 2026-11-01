import { createFileRoute, Link } from "@tanstack/react-router";
import { getSession } from "#/lib/auth-session";

export const Route = createFileRoute("/")({
	loader: () => getSession(),
	component: Home,
});

function Home() {
	const session = Route.useLoaderData();

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
			{session ? (
				<p className="mt-4 text-lg">
					Signed in as <strong>{session.user.name}</strong>.{" "}
					<Link to="/dashboard" className="text-indigo-600 underline">
						Go to your dashboard
					</Link>
				</p>
			) : (
				<div className="mt-6 flex gap-3">
					<Link
						to="/login"
						className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
					>
						Sign in
					</Link>
					<Link
						to="/signup"
						className="border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50"
					>
						Sign up
					</Link>
				</div>
			)}
		</div>
	);
}
