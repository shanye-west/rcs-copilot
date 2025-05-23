import { useState } from 'react';
import { useLocation } from 'wouter';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { KeyRound, LogIn } from 'lucide-react';
import RowdyCupLogo from '../assets/rowdy-cup-logo.svg';

function LoginPage() {
	const [, navigate] = useLocation();
	const [username, setUsername] = useState('');
	const [passcode, setPasscode] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			const response = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, passcode })
			});

			if (!response.ok) {
				throw new Error('Invalid username or passcode.');
			}

			const data = await response.json();

			if (data.needsPasswordChange) {
				navigate('/');
			} else {
				navigate('/');
			}
		} catch (err: any) {
			setError(err.message);
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
			<div className="mb-8 w-full max-w-md">
				<div className="mb-6 flex justify-center">
					<img src={RowdyCupLogo} alt="Rowdy Cup Logo" className="h-12" />
				</div>

				<Card>
					<CardHeader className="space-y-1">
						<CardTitle className="text-center text-2xl">Welcome Back</CardTitle>
						<CardDescription className="text-center">
							Enter your username and PIN to access your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleLogin} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="username">Username</Label>
								<Input
									id="username"
									placeholder="Enter your username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="pin">
									<div className="flex items-center">
										<KeyRound className="mr-1 h-4 w-4" />
										<span>PIN Code</span>
									</div>
								</Label>
								<Input
									id="pin"
									type="password"
									placeholder="Enter your 4-digit PIN"
									value={passcode}
									onChange={(e) => {
										// Only allow numeric input and limit to 4 digits
										const val = e.target.value;
										if (/^\d*$/.test(val) && val.length <= 4) {
											setPasscode(val);
										}
									}}
									maxLength={4}
									pattern="\d{4}"
									inputMode="numeric"
									autoComplete="current-password"
									required
								/>
								<div className="flex items-center justify-between text-xs">
									<div className="flex items-center space-x-1">
										{[...Array(4)].map((_, i) => (
											<div
												key={i}
												className={`h-1 w-5 rounded-full ${i < passcode.length ? 'bg-blue-500' : 'bg-gray-200'}`}
											/>
										))}
									</div>
									<span className="text-muted-foreground">4-digit PIN</span>
								</div>
							</div>

							{error && (
								<div className="rounded-md border border-red-200 bg-red-50 p-3">
									<p className="text-sm text-red-600">{error}</p>
								</div>
							)}

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? (
									<span className="flex items-center justify-center">
										<svg
											className="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Logging in...
									</span>
								) : (
									<span className="flex items-center justify-center">
										<LogIn className="mr-2 h-4 w-4" />
										Sign In
									</span>
								)}
							</Button>
						</form>
					</CardContent>
					<CardFooter className="flex flex-col">
						<p className="text-muted-foreground text-center text-xs">
							By signing in, you agree to the terms and conditions of the Rowdy Cup Tournament.
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}

export default LoginPage;
