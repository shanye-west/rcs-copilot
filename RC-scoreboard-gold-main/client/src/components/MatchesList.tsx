import { useLocation } from 'wouter';
import { Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
// Add these imports
import aviatorsLogo from '../assets/aviators-text.svg';
import producersLogo from '../assets/producers-text.svg';

interface Match {
	id: number;
	name: string;
	status: string;
	aviatorPlayers: string;
	producerPlayers: string;
	leadingTeam: string | null;
	leadAmount: number;
	result: string | null;
	currentHole?: number;
	roundId: number;
	locked?: boolean;
}

interface MatchesListProps {
	matches: Match[];
}

const MatchesList = ({ matches }: MatchesListProps) => {
	const [_, navigate] = useLocation();
	const { isAdmin } = useAuth();
	const { toast } = useToast();
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	// Delete match mutation
	const deleteMatchMutation = useMutation({
		mutationFn: async (matchId: number) => {
			const res = await apiRequest('DELETE', `/api/matches/${matchId}`);
			if (res.ok) {
				return matchId;
			} else {
				const error = await res.json();
				throw new Error(error.message || 'Failed to delete match');
			}
		},
		onSuccess: (matchId) => {
			// Get the round ID before the match is removed from the matches array
			const match = matches.find((m) => m.id === matchId);
			const roundId = match?.roundId;

			// Force refetch all relevant data to ensure UI is completely in sync
			queryClient.invalidateQueries({ queryKey: [`/api/matches`] });
			// Also invalidate scores query for this match
			queryClient.invalidateQueries({ queryKey: [`/api/scores?matchId=${matchId}`] });
			if (roundId) {
				queryClient.invalidateQueries({ queryKey: [`/api/matches?roundId=${roundId}`] });
				queryClient.invalidateQueries({ queryKey: [`/api/rounds/${roundId}`] });
				queryClient.invalidateQueries({ queryKey: [`/api/rounds`] });
			}
			queryClient.invalidateQueries({ queryKey: [`/api/tournament`] });

			toast({
				title: 'Match deleted',
				description: 'Match and all associated scores have been deleted successfully',
				duration: 3000
			});
			setConfirmDeleteId(null);
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to delete match',
				description: error.message,
				variant: 'destructive',
				duration: 3000
			});
		}
	});

	// Add toggle lock mutation
	const toggleLockMutation = useMutation({
		mutationFn: async ({ matchId, locked }: { matchId: number; locked: boolean }) => {
			const res = await apiRequest('PUT', `/api/matches/${matchId}`, {
				locked: locked
			});
			return { id: matchId, locked };
		},
		onSuccess: (data) => {
			// Update the cache
			queryClient.invalidateQueries({ queryKey: [`/api/matches`] });
			queryClient.invalidateQueries({ queryKey: [`/api/matches/${data.id}`] });

			toast({
				title: data.locked ? 'Match locked' : 'Match unlocked',
				description: data.locked
					? 'The match has been locked to prevent further edits.'
					: 'The match has been unlocked for editing.',
				duration: 1000
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Error updating match lock status',
				description: error.message,
				variant: 'destructive',
				duration: 1000
			});
		}
	});

	const handleMatchClick = (matchId: number) => {
		navigate(`/matches/${matchId}`);
	};

	const handleDeleteClick = (e: React.MouseEvent, matchId: number) => {
		e.stopPropagation();
		setConfirmDeleteId(matchId);
	};

	const confirmDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirmDeleteId !== null) {
			deleteMatchMutation.mutate(confirmDeleteId);
		}
	};

	const cancelDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		setConfirmDeleteId(null);
	};

	// Add function to handle lock toggle
	const handleToggleLock = (e: React.MouseEvent, matchId: number) => {
		e.stopPropagation();
		const match = matches.find((m) => m.id === matchId);
		if (match) {
			toggleLockMutation.mutate({
				matchId,
				locked: !match.locked
			});
		}
	};

	const renderMatchStatus = (match: Match) => {
		if (match.status === 'completed') {
			return (
				<div className="flex items-center space-x-1">
					<span className="inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-800">
						Completed
					</span>
					{match.locked && <Lock className="h-3 w-3 text-gray-500" title="Match locked" />}
				</div>
			);
		} else if (match.status === 'in_progress') {
			return (
				<div className="flex items-center space-x-1">
					<span className="inline-block rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
						In Progress
					</span>
					{match.locked && <Lock className="h-3 w-3 text-gray-500" title="Match locked" />}
				</div>
			);
		} else {
			return (
				<div className="flex items-center space-x-1">
					<span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
						Upcoming
					</span>
					{match.locked && <Lock className="h-3 w-3 text-gray-500" title="Match locked" />}
				</div>
			);
		}
	};

	const renderMatchResult = (match: Match) => {
		if (match.status === 'completed' && match.result) {
			const winningTeam =
				match.leadingTeam === 'aviators' ? (
					<img src={aviatorsLogo} alt="Aviators" className="inline-block h-5" />
				) : (
					<img src={producersLogo} alt="Producers" className="inline-block h-5" />
				);

			return (
				<div className="font-heading rounded-lg bg-gray-100 py-2 text-center font-bold">
					{winningTeam} win {match.result}
				</div>
			);
		} else if (match.status === 'in_progress' && match.leadingTeam) {
			const leadingTeam =
				match.leadingTeam === 'aviators' ? (
					<img src={aviatorsLogo} alt="Aviators" className="inline-block h-5" />
				) : (
					<img src={producersLogo} alt="Producers" className="inline-block h-5" />
				);

			return (
				<div className="flex items-center justify-center">
					<div className="font-heading rounded-lg bg-gray-100 px-3 py-1 text-center font-bold">
						{leadingTeam}
						<span className="ml-1 rounded bg-white px-2 py-1 font-mono text-sm">
							{match.leadAmount > 0 ? `${match.leadAmount}&${18 - (match.currentHole || 1)}` : '-'}
						</span>
					</div>
					<div className="ml-2 text-xs text-gray-500">Hole {match.currentHole || 1}</div>
				</div>
			);
		} else if (match.status === 'in_progress') {
			return (
				<div className="font-heading rounded-lg bg-gray-100 py-2 text-center font-bold">
					ALL SQUARE
				</div>
			);
		}

		return null;
	};

	const renderMatchStatusDisplay = (match: Match) => {
		if (match.status === 'completed' && match.result) {
			return null; // Result is already displayed
		} else if (match.status === 'in_progress') {
			if (match.leadingTeam) {
				// Display leading team status
				const textColor = match.leadingTeam === 'aviators' ? 'text-aviator' : 'text-producer';
				return (
					<div className={`py-1 text-center font-semibold ${textColor}`}>{match.leadAmount} UP</div>
				);
			} else {
				// Display All Square
				return <div className="py-1 text-center font-semibold text-gray-600">AS</div>;
			}
		}
		return null;
	};

	return (
		<div className="space-y-4">
			{matches
				.sort((a, b) => a.name.localeCompare(b.name)) // Sort matches by name
				.map((match) => (
					<div
						key={match.id}
						className="relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-md"
						onClick={() => handleMatchClick(match.id)}
					>
						<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
							<h4 className="font-heading font-bold">{match.name}</h4>
							<div className="flex items-center space-x-2">
								{isAdmin && (
									<div className="mr-2" onClick={(e) => e.stopPropagation()}>
										{confirmDeleteId === match.id ? (
											<div className="flex space-x-1">
												<Button
													size="sm"
													variant="destructive"
													className="h-7 px-2 py-1 text-xs"
													onClick={confirmDelete}
												>
													Confirm
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="h-7 px-2 py-1 text-xs"
													onClick={cancelDelete}
												>
													Cancel
												</Button>
											</div>
										) : (
											<div className="flex space-x-1">
												<Button
													size="icon"
													variant="ghost"
													className="h-6 w-6"
													onClick={(e) => handleDeleteClick(e, match.id)}
												>
													<Trash2 className="h-3 w-3" />
												</Button>
												{/* Add lock button */}
												<Button
													size="icon"
													variant="ghost"
													className="h-6 w-6"
													onClick={(e) => handleToggleLock(e, match.id)}
												>
													{match.locked ? (
														<Unlock className="h-3 w-3" />
													) : (
														<Lock className="h-3 w-3" />
													)}
												</Button>
											</div>
										)}
									</div>
								)}
								{renderMatchStatus(match)}
							</div>
						</div>

						<div className="p-4">
							<div className="mb-2 flex">
								<div className="w-1/2 border-r border-gray-200 pr-3">
									<div className="mb-1 flex items-center">
										<div className="bg-aviator mr-2 h-3 w-3 rounded-full"></div>
										<img src={aviatorsLogo} alt="Aviators" className="h-5" />
									</div>
									<div className="text-sm text-gray-600">
										{match.aviatorPlayers.split(', ').map((player, index) => (
											<div key={index}>{player}</div>
										))}
									</div>
								</div>

								<div className="w-1/2 pl-3">
									<div className="mb-1 flex items-center justify-end">
										<div className="bg-producer mr-2 h-3 w-3 rounded-full"></div>
										<img src={producersLogo} alt="Producers" className="h-5" />
									</div>
									<div className="text-right text-sm text-gray-600">
										{match.producerPlayers.split(', ').map((player, index) => (
											<div key={index}>{player}</div>
										))}
									</div>
								</div>
							</div>

							{/* Display match status */}
							{renderMatchStatusDisplay(match)}

							{renderMatchResult(match)}
						</div>
					</div>
				))}
		</div>
	);
};

export default MatchesList;
