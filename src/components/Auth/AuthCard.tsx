import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

export function AuthCard({
	title,
	description,
	children,
	footer,
}: {
	title: string;
	description?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<div className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">{title}</CardTitle>
					{description ? (
						<CardDescription>{description}</CardDescription>
					) : null}
				</CardHeader>
				<CardContent className="space-y-6">{children}</CardContent>
				{footer ? (
					<CardFooter className="justify-center text-sm text-muted-foreground">
						{footer}
					</CardFooter>
				) : null}
			</Card>
		</div>
	);
}
