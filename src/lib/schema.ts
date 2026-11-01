import { z } from "zod";

// Shared by the forms (client) and the Better Auth hooks (server), so both
// sides enforce exactly the same rules.

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export const passwordRules = [
	{
		id: "length",
		label: `At least ${PASSWORD_MIN} characters`,
		test: (v: string) => v.length >= PASSWORD_MIN,
	},
	{
		id: "upper",
		label: "One uppercase letter",
		test: (v: string) => /[A-Z]/.test(v),
	},
	{
		id: "lower",
		label: "One lowercase letter",
		test: (v: string) => /[a-z]/.test(v),
	},
	{ id: "number", label: "One number", test: (v: string) => /[0-9]/.test(v) },
	{
		id: "symbol",
		label: "One symbol (e.g. ! ? # @)",
		test: (v: string) => /[^A-Za-z0-9\s]/.test(v),
	},
] as const;

export const nameSchema = z
	.string()
	.trim()
	.min(2, "Name must be at least 2 characters")
	.max(50, "Name must not exceed 50 characters")
	.regex(
		/^[\p{L}\p{M}][\p{L}\p{M} '.-]*$/u,
		"Name can only contain letters, spaces, apostrophes, dots and hyphens",
	);

export const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.max(254, "Email must not exceed 254 characters")
	.pipe(z.email("Please enter a valid email address"));

export const passwordSchema = z
	.string()
	.max(PASSWORD_MAX, `Password must not exceed ${PASSWORD_MAX} characters`)
	.superRefine((value, ctx) => {
		for (const rule of passwordRules) {
			if (!rule.test(value)) {
				ctx.addIssue({
					code: "custom",
					message: `Password needs: ${rule.label.toLowerCase()}`,
				});
			}
		}
		if (/^\s|\s$/.test(value)) {
			ctx.addIssue({
				code: "custom",
				message: "Password can't start or end with a space",
			});
		}
	});

// Rejects passwords that contain the user's name or the local part of their email
export function passwordContainsPersonalInfo(
	password: string,
	email: string,
	name?: string,
) {
	const lower = password.toLowerCase();
	const parts = [email.split("@")[0], ...(name ?? "").split(/\s+/)]
		.map((p) => p.toLowerCase())
		.filter((p) => p.length >= 3);
	return parts.some((p) => lower.includes(p));
}

export const signUpSchema = z
	.object({
		name: nameSchema,
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: z.string(),
		acceptTerms: z
			.boolean()
			.refine((v) => v, "You must accept the terms to continue"),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirmPassword) {
			ctx.addIssue({
				code: "custom",
				path: ["confirmPassword"],
				message: "Passwords don't match",
			});
		}
		if (passwordContainsPersonalInfo(data.password, data.email, data.name)) {
			ctx.addIssue({
				code: "custom",
				path: ["password"],
				message: "Password can't contain your name or email",
			});
		}
	});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
	email: emailSchema,
	// Only check presence here: the policy may have changed since the account was created
	password: z
		.string()
		.min(1, "Password is required")
		.max(PASSWORD_MAX, "Password is too long"),
	rememberMe: z.boolean(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
	.object({ password: passwordSchema, confirmPassword: z.string() })
	.refine((d) => d.password === d.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords don't match",
	});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: passwordSchema,
		confirmPassword: z.string(),
		revokeOtherSessions: z.boolean(),
	})
	.superRefine((d, ctx) => {
		if (d.newPassword !== d.confirmPassword) {
			ctx.addIssue({
				code: "custom",
				path: ["confirmPassword"],
				message: "Passwords don't match",
			});
		}
		if (d.newPassword === d.currentPassword) {
			ctx.addIssue({
				code: "custom",
				path: ["newPassword"],
				message: "New password must be different",
			});
		}
	});

export const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

// Better Auth backup codes are 10 characters, shown as XXXXX-XXXXX
export const backupCodeSchema = z
	.string()
	.trim()
	.regex(
		/^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/,
		"Enter a backup code like ABCDE-12345",
	);
