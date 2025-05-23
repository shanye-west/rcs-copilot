import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Redirect, Route } from 'wouter';

type ProtectedRouteProps = {
	path: string;
	component: React.ComponentType;
	adminOnly?: boolean;
};

export function ProtectedRoute({
	path,
	component: Component,
	adminOnly = false
}: ProtectedRouteProps) {
	const { user, isLoading, isAdmin } = useAuth();

	return (
		<Route path={path}>
			{() => {
				if (isLoading) {
					return (
						<div className="flex min-h-screen items-center justify-center">
							<Loader2 className="text-border h-8 w-8 animate-spin" />
						</div>
					);
				}

				if (!user) {
					return <Redirect to="/auth" />;
				}

				if (adminOnly && !isAdmin) {
					return (
						<div className="flex min-h-screen flex-col items-center justify-center p-4">
							<h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
							<p className="text-muted-foreground mb-4">
								You don't have permission to access this page.
							</p>
							<Redirect to="/" />
						</div>
					);
				}

				return <Component />;
			}}
		</Route>
	);
}
