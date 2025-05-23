import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Redirect } from 'wouter';

export default function AuthPage() {
	const { user, loginMutation } = useAuth();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		loginMutation.mutate({ username, password });
	};

	// Redirect to home if already logged in
	if (user) {
		return <Redirect to="/" />;
	}

	return (
		<div className="flex min-h-screen flex-col md:flex-row">
			{/* Auth Form */}
			<div className="flex flex-1 items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-bold">Login</CardTitle>
						<CardDescription>
							Enter your credentials to access the Rowdy Cup admin panel
						</CardDescription>
					</CardHeader>
					<form onSubmit={handleSubmit}>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="username">Username</Label>
								<Input
									id="username"
									type="text"
									placeholder="Enter your username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
						</CardContent>
						<CardFooter>
							<Button type="submit" className="w-full" disabled={loginMutation.isPending}>
								{loginMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Logging in...
									</>
								) : (
									'Login'
								)}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</div>

			{/* Hero Section */}
			<div className="bg-primary text-primary-foreground flex flex-1 flex-col justify-center p-6">
				<div className="mx-auto max-w-md">
					<h1 className="mb-4 text-3xl font-bold">Rowdy Cup Scoreboard</h1>
					<p className="mb-6 text-xl">
						Tournament administration panel for the Rowdy Cup golf tournament.
					</p>
					<div className="space-y-4">
						<div className="flex items-start space-x-3">
							<div className="bg-primary-foreground text-primary mt-0.5 flex h-8 w-8 items-center justify-center rounded-full">
								1
							</div>
							<div>
								<h3 className="font-semibold">Create Tournament</h3>
								<p className="text-primary-foreground/80 text-sm">
									Set up tournament details, rounds, and matches
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-3">
							<div className="bg-primary-foreground text-primary mt-0.5 flex h-8 w-8 items-center justify-center rounded-full">
								2
							</div>
							<div>
								<h3 className="font-semibold">Manage Players</h3>
								<p className="text-primary-foreground/80 text-sm">
									Add, edit, and organize players in their teams
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-3">
							<div className="bg-primary-foreground text-primary mt-0.5 flex h-8 w-8 items-center justify-center rounded-full">
								3
							</div>
							<div>
								<h3 className="font-semibold">Track Scores</h3>
								<p className="text-primary-foreground/80 text-sm">
									Monitor match progress and update tournament standings
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
