import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import FooterNavigation from './FooterNavigation';
import FirstLoginPasswordChange from './FirstLoginPasswordChange';
import RowdyCupLogo from '../assets/rowdy-cup-logo.svg';

interface LayoutProps {
	children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
	const [isNavOpen, setIsNavOpen] = useState(false);
	const [showPasswordChange, setShowPasswordChange] = useState(false);
	const [_, navigate] = useLocation();
	const { user, isAuthenticated, isAdmin, logoutMutation } = useAuth();

	// Show password change dialog if user is authenticated and needs password change
	useEffect(() => {
		if (isAuthenticated && user && user.needsPasswordChange) {
			setShowPasswordChange(true);
		} else {
			setShowPasswordChange(false);
		}
	}, [isAuthenticated, user]);

	const toggleNav = () => {
		setIsNavOpen(!isNavOpen);
	};

	const closeNav = () => {
		setIsNavOpen(false);
	};

	const handleNavigation = (path: string) => {
		navigate(path);
		closeNav();
	};

	return (
		<div className="flex min-h-screen flex-col">
			{/* Header with static navigation */}
			<header className="bg-white shadow-md">
				<div className="container mx-auto flex items-center justify-between px-4 py-3">
					{/* Logo */}
					<a
						href="https://rowdycup.com"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center"
					>
						<img src={RowdyCupLogo} alt="Rowdy Cup" className="h-10" />
					</a>

					{/* Static Navigation Buttons */}
					<div className="flex items-center space-x-3">
						{/* Home Button */}
						<button
							className="rounded-md px-3 py-1 font-medium text-gray-800 hover:bg-gray-100"
							onClick={() => handleNavigation('/')}
						>
							Home
						</button>

						{/* Teams Button */}
						<button
							className="rounded-md px-3 py-1 font-medium text-gray-800 hover:bg-gray-100"
							onClick={() => handleNavigation(isAdmin ? '/admin/players' : '/teams')}
						>
							Teams
						</button>

						{/* History Button */}
						<button
							className="rounded-md px-3 py-1 font-medium text-gray-800 hover:bg-gray-100"
							onClick={() => handleNavigation('/history')}
						>
							History
						</button>

						{/* Login/Logout Button */}
						{isAuthenticated ? (
							<button
								className="rounded-md bg-gray-100 px-3 py-1 font-medium text-rose-600 hover:bg-gray-200"
								onClick={() => {
									// Use the auth context's logout mutation
									logoutMutation.mutate(undefined, {
										onSuccess: () => handleNavigation('/')
									});
								}}
							>
								Logout
							</button>
						) : (
							<button
								className="rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-800 hover:bg-gray-200"
								onClick={() => handleNavigation('/auth')}
							>
								Login
							</button>
						)}
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1">{children}</main>

			{/* Footer Navigation */}
			<FooterNavigation onNavigate={handleNavigation} />

			{/* First Login Password Change Dialog */}
			{showPasswordChange && (
				<FirstLoginPasswordChange onComplete={() => setShowPasswordChange(false)} />
			)}
		</div>
	);
};

export default Layout;
