import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	ownerAc,
} from "better-auth/plugins/organization/access";

// Single source of truth for what each workspace role may do.
// Imported by the server (auth.ts) and the browser (auth-client.ts), so both
// sides agree. Add new resources here, e.g. invoice: ["create", "read", ...].
export const statements = {
	...defaultStatements,
	project: ["create", "read", "update", "delete"],
	customer: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statements);

export const owner = ac.newRole({
	...ownerAc.statements,
	project: ["create", "read", "update", "delete"],
	customer: ["create", "read", "update", "delete"],
});

// Like owner, but can't delete the workspace
export const admin = ac.newRole({
	...adminAc.statements,
	project: ["create", "read", "update", "delete"],
	customer: ["create", "read", "update", "delete"],
});

export const editor = ac.newRole({
	project: ["create", "read", "update"],
	customer: ["create", "read", "update"],
});

export const viewer = ac.newRole({
	project: ["read"],
	customer: ["read"],
});

export const roles = { owner, admin, editor, viewer };

export type WorkspaceRole = keyof typeof roles;

// Roles that can be given through an invitation or a role change.
// "owner" is only assigned to the workspace creator.
export const ASSIGNABLE_ROLES = ["admin", "editor", "viewer"] as const;

export const ROLE_LABELS: Record<
	WorkspaceRole,
	{ label: string; description: string }
> = {
	owner: {
		label: "Owner",
		description: "Full control, including deleting the workspace",
	},
	admin: {
		label: "Admin",
		description:
			"Manage members, invitations, settings, projects and customers",
	},
	editor: {
		label: "Editor",
		description: "Create, view and edit projects and customers",
	},
	viewer: { label: "Viewer", description: "View projects and customers only" },
};

export type Permissions = {
	[K in keyof typeof statements]?: (typeof statements)[K][number][];
};
