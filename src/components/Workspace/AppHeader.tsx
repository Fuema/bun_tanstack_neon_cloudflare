import { Link } from "@tanstack/react-router";
import { SignOutButton } from "#/components/Auth/SignOutButton";
import type { WorkspaceAccess } from "#/lib/authz";
import { RoleBadge } from "./RoleBadge";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const linkClass =
	"rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const activeClass = "bg-muted font-medium text-foreground";

export function AppHeader({ access }: { access: WorkspaceAccess | null }) {
	return (
		<header className="border-b bg-background">
			<div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
				{access ? (
					<div className="flex items-center gap-2">
						<WorkspaceSwitcher access={access} />
						<RoleBadge role={access.role} />
					</div>
				) : null}
				<nav className="flex flex-wrap items-center gap-1" aria-label="Main">
					<Link
						to="/dashboard"
						className={linkClass}
						activeProps={{ className: activeClass }}
					>
						Dashboard
					</Link>
					<Link
						to="/projects"
						className={linkClass}
						activeProps={{ className: activeClass }}
					>
						Projects
					</Link>
					<Link
						to="/workspace/members"
						className={linkClass}
						activeProps={{ className: activeClass }}
					>
						Members
					</Link>
					<Link
						to="/workspace/settings"
						className={linkClass}
						activeProps={{ className: activeClass }}
					>
						Workspace
					</Link>
					<Link
						to="/account/security"
						className={linkClass}
						activeProps={{ className: activeClass }}
					>
						Security
					</Link>
				</nav>
				<div className="ml-auto">
					<SignOutButton />
				</div>
			</div>
		</header>
	);
}
