import { createAuthClient } from "better-auth/react";

// No baseURL: the client calls /api/auth on the current origin, which works on
// localhost and on Cloudflare, and avoids touching `window` during SSR.
export const authClient = createAuthClient();
