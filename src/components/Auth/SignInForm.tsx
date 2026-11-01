import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { authClient } from "#/lib/auth-client";
import { signInSchema } from "#/lib/schema";

export function SignInForm() {
	const router = useRouter();

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: {
			// Changed to onBlur to optimize performance and prevent aggressive early errors
			onBlur: signInSchema,
		},
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			});

			if (error) {
				alert(error.message || "Invalid credentials.");
			} else {
				// Use type-safe SPA navigation instead of hard page reloading
				await router.navigate({ to: "/dashboard" });
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-xl shadow"
		>
			<form.Field name="email">
				{(field) => (
					<div className="flex flex-col gap-1">
						<label
							htmlFor={field.name}
							className="text-sm font-semibold text-slate-700"
						>
							Email
						</label>
						<input
							id={field.name}
							type="email"
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="you@example.com"
							autoComplete="email"
							className="border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-indigo-500"
						/>
						{field.state.meta.errors.length ? (
							<span className="text-xs text-red-500 font-medium">
								{field.state.meta.errors.map((e) => e?.message).join(", ")}
							</span>
						) : null}
					</div>
				)}
			</form.Field>

			<form.Field name="password">
				{(field) => (
					<div className="flex flex-col gap-1">
						<label
							htmlFor={field.name}
							className="text-sm font-semibold text-slate-700"
						>
							Password
						</label>
						<input
							id={field.name}
							type="password"
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="••••••••"
							autoComplete="current-password"
							className="border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-indigo-500"
						/>
						{field.state.meta.errors.length ? (
							<span className="text-xs text-red-500 font-medium">
								{field.state.meta.errors.map((e) => e?.message).join(", ")}
							</span>
						) : null}
					</div>
				)}
			</form.Field>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
			>
				{([canSubmit, isSubmitting]) => (
					<button
						type="submit"
						disabled={!canSubmit || isSubmitting}
						className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
					>
						{isSubmitting ? "Logging in..." : "Sign In"}
					</button>
				)}
			</form.Subscribe>
		</form>
	);
}
