import rowdyCupLogo from '../assets/rowdy-cup-logo.svg';
import { useAuth } from '@/hooks/use-auth';

interface MainNavigationProps {
	isOpen: boolean;
	onNavigate: (path: string) => void;
}

const MainNavigation = ({ isOpen, onNavigate }: MainNavigationProps) => {
	const { isAuthenticated, logoutMutation } = useAuth();

	if (!isOpen) return null;

	return (
		<nav className="bg-white shadow-md">
			<div className="container mx-auto px-4 py-2">
				<div className="mb-4 flex justify-center">
					<img src={rowdyCupLogo} alt="Rowdy Cup" className="h-16" />
				</div>

				<ul className="space-y-1">
					<li>
						<button
							className="block w-full rounded px-3 py-2 text-left font-semibold hover:bg-gray-100"
							onClick={() => onNavigate('/')}
						>
							Home
						</button>
					</li>

					<li>
						<button
							className="block w-full rounded px-3 py-2 text-left hover:bg-gray-100"
							onClick={() => onNavigate('/teams')}
						>
							Team Rosters
						</button>
					</li>

					<li>
						<button
							className="block w-full rounded px-3 py-2 text-left hover:bg-gray-100"
							onClick={() => onNavigate('/sportsbook')}
						>
							Sportsbook
						</button>
					</li>

					{!isAuthenticated ? (
						<li>
							<button
								className="mt-4 block w-full rounded bg-gray-100 px-3 py-2 text-center text-left hover:bg-gray-200"
								onClick={() => onNavigate('/auth')}
							>
								Login
							</button>
						</li>
					) : (
						<li>
							<button
								className="mt-4 block w-full rounded bg-gray-100 px-3 py-2 text-center text-left text-rose-600 hover:bg-gray-200"
								onClick={() => {
									logoutMutation.mutate();
									onNavigate('/');
								}}
							>
								Logout
							</button>
						</li>
					)}
				</ul>
			</div>
		</nav>
	);
};

export default MainNavigation;
