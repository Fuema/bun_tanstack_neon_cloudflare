import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { authClient, authErrorMessage } from "#/lib/auth-client";
import type { WorkspaceAccess } from "#/lib/authz";

const NEW_WORKSPACE = "__new__";

export function WorkspaceSwitcher({ access }: { access: WorkspaceAccess }) {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	const switchTo = async (organizationId: string) => {
		if (organizationId === NEW_WORKSPACE) {
			await router.navigate({ to: "/workspace/new" });
			return;
		}
		if (organizationId === access.organizationId) return;
		setPending(true);
		const { error } = await authClient.organization.setActive({
			organizationId,
		});
		setPending(false);
		if (error) {
			window.alert(authErrorMessage(error));
			return;
		}
		// Re-run the guards so role, permissions and data reload for the new workspace
		await router.invalidate();
	};

	return (
		<Select
			value={access.organizationId}
			onValueChange={switchTo}
			disabled={pending}
		>
			<SelectTrigger className="w-48" aria-label="Current workspace">
				<SelectValue placeholder="Choose a workspace" />
			</SelectTrigger>
			<SelectContent>
				{access.workspaces.map((w) => (
					<SelectItem key={w.id} value={w.id}>
						{w.name}
					</SelectItem>
				))}
				<SelectSeparator />
				<SelectItem value={NEW_WORKSPACE}>+ New workspace</SelectItem>
			</SelectContent>
		</Select>
	);
}
