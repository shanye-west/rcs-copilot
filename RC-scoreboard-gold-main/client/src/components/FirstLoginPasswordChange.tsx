import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, KeyRound } from 'lucide-react';

const FirstLoginPasswordChange = ({ onComplete }: { onComplete: () => void }) => {
	const { toast } = useToast();
	const { user } = useAuth();
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [focusedInput, setFocusedInput] = useState<string | null>(null);

	// Only allow digits (0-9) in the PIN
	const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value;
		if (/^\d*$/.test(input) && input.length <= 4) {
			setNewPassword(input);
			setError('');
		}
	};

	const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value;
		if (/^\d*$/.test(input) && input.length <= 4) {
			setConfirmPassword(input);
			setError('');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Basic validation
		if (newPassword.length !== 4) {
			setError('PIN must be exactly 4 digits');
			return;
		}

		if (newPassword !== confirmPassword) {
			setError('PINs do not match');
			return;
		}

		try {
			setLoading(true);
			const res = await apiRequest('POST', '/api/change-password', {
				newPassword
			});

			if (res.ok) {
				toast({
					title: 'PIN changed successfully',
					description: 'Your PIN has been updated.'
				});
				queryClient.invalidateQueries({ queryKey: ['/api/user'] });
				onComplete();
			} else {
				const data = await res.json();
				setError(data.message || 'Failed to change PIN');
			}
		} catch (err) {
			setError('An error occurred while changing your PIN');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="m-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
				<div className="mb-3 flex items-center">
					<KeyRound className="mr-2 h-6 w-6 text-blue-500" />
					<h2 className="text-xl font-bold">First Login - Change Your PIN</h2>
				</div>

				<div className="mb-6 text-sm text-gray-600">
					<p className="mb-2">
						Welcome to the Rowdy Cup Scoreboard! For security reasons, you must change your PIN
						before continuing.
					</p>
					<p>
						Please enter a new 4-digit PIN that you'll remember. You'll use this PIN to log in to
						the application in the future.
					</p>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium">New PIN</label>
							<input
								type="password"
								value={newPassword}
								onChange={handlePinChange}
								onFocus={() => setFocusedInput('new')}
								onBlur={() => setFocusedInput(null)}
								className={`w-full rounded-md border px-3 py-2 ${focusedInput === 'new' ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
								placeholder="Enter 4-digit PIN"
								pattern="\d{4}"
								maxLength={4}
								inputMode="numeric"
								autoComplete="new-password"
								required
							/>
							<div className="mt-1 flex text-xs text-gray-500">
								<span className="mr-1">PIN security:</span>
								<div className="flex items-center space-x-1">
									{[...Array(4)].map((_, i) => (
										<div
											key={i}
											className={`h-1 w-5 rounded-full ${i < newPassword.length ? 'bg-blue-500' : 'bg-gray-200'}`}
										/>
									))}
								</div>
							</div>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium">Confirm PIN</label>
							<input
								type="password"
								value={confirmPassword}
								onChange={handleConfirmPinChange}
								onFocus={() => setFocusedInput('confirm')}
								onBlur={() => setFocusedInput(null)}
								className={`w-full rounded-md border px-3 py-2 ${focusedInput === 'confirm' ? 'border-blue-500 ring-1 ring-blue-500' : ''} ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : ''}`}
								placeholder="Confirm 4-digit PIN"
								pattern="\d{4}"
								maxLength={4}
								inputMode="numeric"
								autoComplete="new-password"
								required
							/>
							{confirmPassword && newPassword !== confirmPassword && (
								<p className="mt-1 text-xs text-red-500">PINs do not match</p>
							)}
						</div>

						{error && (
							<div className="rounded-md border border-red-200 bg-red-50 p-3">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						<div className="mt-6 flex justify-end">
							<Button
								type="submit"
								disabled={loading || newPassword.length !== 4 || newPassword !== confirmPassword}
								className="px-5"
							>
								{loading ? (
									<span className="flex items-center">
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Changing...
									</span>
								) : (
									'Save New PIN'
								)}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default FirstLoginPasswordChange;
