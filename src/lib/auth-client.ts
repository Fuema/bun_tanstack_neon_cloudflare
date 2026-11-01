import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// No baseURL: the client calls /api/auth on the current origin, which works on
// localhost and on Cloudflare, and avoids touching `window` during SSR.
export const authClient = createAuthClient({
	plugins: [
		twoFactorClient({
			// Password sign-in for a user with 2FA returns no session yet: send them to the second step
			onTwoFactorRedirect() {
				window.location.href = "/two-factor";
			},
		}),
		passkeyClient(),
	],
});

// Turns Better Auth error codes into messages a user can act on
export function authErrorMessage(
	error:
		| { code?: string; message?: string; status?: number }
		| null
		| undefined,
) {
	if (!error) return "Something went wrong. Please try again.";
	if (error.status === 429)
		return "Too many attempts. Please wait a minute and try again.";
	switch (error.code) {
		case "INVALID_EMAIL_OR_PASSWORD":
			return "Incorrect email or password.";
		case "EMAIL_NOT_VERIFIED":
			return "Please verify your email first. We've sent you a new link.";
		case "USER_ALREADY_EXISTS":
		case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
			return "An account with this email already exists. Try signing in instead.";
		case "INVALID_CODE":
			return "That code isn't valid. Check it and try again.";
		case "OTP_HAS_EXPIRED":
			return "That code has expired. Request a new one.";
		case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
			return "Too many wrong codes. Request a new one.";
		case "ACCOUNT_TEMPORARILY_LOCKED":
			return "Too many failed attempts. Your account is locked for 15 minutes.";
		case "INVALID_TWO_FACTOR_COOKIE":
			return "Your sign-in attempt expired. Please sign in again.";
		case "INVALID_BACKUP_CODE":
			return "That backup code isn't valid or was already used.";
		case "INVALID_PASSWORD":
			return "Incorrect password.";
		case "INVALID_TOKEN":
			return "This link is invalid or has expired. Request a new one.";
		case "SESSION_EXPIRED":
			return "For your security, please sign in again to continue.";
		default:
			return error.message || "Something went wrong. Please try again.";
	}
}
