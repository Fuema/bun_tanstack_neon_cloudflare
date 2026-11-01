import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";

export function SignOutButton() {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);

	const handleSignOut = async () => {
		setIsPending(true);
		await authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					// Type-safe navigation instead of a full page reload
					await router.navigate({ to: "/login" });
				},
				onError: (ctx) => {
					alert(ctx.error.message || "Failed to log out correctly.");
					setIsPending(false);
				},
			},
		});
	};

	return (
		<button
			type="button"
			onClick={handleSignOut}
			disabled={isPending}
			className="sign-out-btn disabled:opacity-50 cursor-pointer"
		>
			{isPending ? "Signing out..." : "Sign Out"}
		</button>
	);
}
