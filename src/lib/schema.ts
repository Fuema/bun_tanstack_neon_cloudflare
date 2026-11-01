import { z } from "zod";

export const signUpSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must not exceed 50 characters"),
	email: z.email("Please enter a valid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
});

// Infer type definitions if needed elsewhere in your modules
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;
