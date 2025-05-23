import { useQuery, useMutation } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { UserPlus, Trash, Edit, Circle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Player {
	id: number;
	name: string;
	teamId: number;
	wins: number;
	losses: number;
	ties: number;
}

interface Team {
	id: number;
	name: string;
	shortName: string;
	colorCode: string;
}

const AdminPlayersPage = () => {
	const [_, navigate] = useLocation();
	const { toast } = useToast();
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [playerToDelete, setPlayerToDelete] = useState<number | null>(null);
	const [playerToEdit, setPlayerToEdit] = useState<number | null>(null);
	const [playerFormData, setPlayerFormData] = useState({
		name: '',
		teamId: 0,
		wins: 0,
		losses: 0,
		ties: 0
	});

	// Fetch teams data
	const { data: teams, isLoading: isTeamsLoading } = useQuery<Team[]>({
		queryKey: ['/api/teams']
	});

	// Fetch players data
	const { data: players, isLoading: isPlayersLoading } = useQuery<Player[]>({
		queryKey: ['/api/players']
	});

	const isLoading = isTeamsLoading || isPlayersLoading;

	// Add player mutation
	const addPlayerMutation = useMutation({
		mutationFn: async (playerData: any) => {
			const res = await apiRequest('POST', '/api/players', playerData);
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/players'] });
			toast({
				title: 'Player added',
				description: 'New player has been added successfully',
				duration: 1000
			});
			setIsAddDialogOpen(false);
			resetPlayerForm();
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to add player',
				description: error.message,
				variant: 'destructive',
				duration: 1000
			});
		}
	});

	// Delete player mutation
	const deletePlayerMutation = useMutation({
		mutationFn: async (playerId: number) => {
			const res = await apiRequest('DELETE', `/api/players/${playerId}`, {});
			return res;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/players'] });
			toast({
				title: 'Player deleted',
				description: 'Player has been removed successfully',
				duration: 1000
			});
			setIsConfirmDeleteOpen(false);
			setPlayerToDelete(null);
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to delete player',
				description: error.message,
				variant: 'destructive',
				duration: 1000
			});
			setIsConfirmDeleteOpen(false);
			setPlayerToDelete(null);
		}
	});

	// Update player mutation
	const updatePlayerMutation = useMutation({
		mutationFn: async (data: { id: number; playerData: any }) => {
			const res = await apiRequest('PATCH', `/api/players/${data.id}`, data.playerData);
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/players'] });
			toast({
				title: 'Player updated',
				description: 'Player has been updated successfully',
				duration: 1000
			});
			setIsEditDialogOpen(false);
			setPlayerToEdit(null);
			resetPlayerForm();
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to update player',
				description: error.message,
				variant: 'destructive',
				duration: 1000
			});
		}
	});

	const handleAddPlayerForTeam = (teamId: number) => {
		resetPlayerForm();
		setPlayerFormData((prev) => ({ ...prev, teamId }));
		setIsAddDialogOpen(true);
	};

	const handleDeletePlayer = (playerId: number) => {
		setPlayerToDelete(playerId);
		setIsConfirmDeleteOpen(true);
	};

	const confirmDeletePlayer = () => {
		if (playerToDelete) {
			deletePlayerMutation.mutate(playerToDelete);
		}
	};

	const resetPlayerForm = () => {
		setPlayerFormData({
			name: '',
			teamId: teams && teams.length > 0 ? teams[0].id : 0,
			wins: 0,
			losses: 0,
			ties: 0
		});
	};

	const handlePlayerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setPlayerFormData({
			...playerFormData,
			[name]: name === 'teamId' ? parseInt(value) : name === 'name' ? value : parseInt(value) || 0
		});
	};

	const handlePlayerFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (playerToEdit) {
			updatePlayerMutation.mutate({
				id: playerToEdit,
				playerData: playerFormData
			});
		} else {
			addPlayerMutation.mutate(playerFormData);
		}
	};

	const handleEditPlayer = (player: Player) => {
		setPlayerToEdit(player.id);
		setPlayerFormData({
			name: player.name,
			teamId: player.teamId,
			wins: player.wins,
			losses: player.losses,
			ties: player.ties
		});
		setIsEditDialogOpen(true);
	};

	const handleBackClick = () => {
		navigate('/admin');
	};

	// Group players by team and sort them by record
	const playersByTeam = players?.reduce((acc: Record<number, Player[]>, player: Player) => {
		if (!acc[player.teamId]) {
			acc[player.teamId] = [];
		}
		acc[player.teamId].push(player);
		return acc;
	}, {});

	// Calculate win percentage for sorting
	const calculateWinPercentage = (player: Player) => {
		const total = player.wins + player.losses + player.ties;
		if (total === 0) return 0;
		return (player.wins + player.ties * 0.5) / total;
	};

	// Sort players by win percentage, then by wins
	if (playersByTeam) {
		Object.keys(playersByTeam).forEach((teamId) => {
			const numTeamId = Number(teamId);
			if (playersByTeam[numTeamId] && Array.isArray(playersByTeam[numTeamId])) {
				playersByTeam[numTeamId].sort((a, b) => {
					const aPercentage = calculateWinPercentage(a);
					const bPercentage = calculateWinPercentage(b);

					if (bPercentage !== aPercentage) {
						return bPercentage - aPercentage;
					}

					// If percentages are equal, sort by number of wins
					if (b.wins !== a.wins) {
						return b.wins - a.wins;
					}

					// If wins are equal, sort alphabetically
					return a.name.localeCompare(b.name);
				});
			}
		});
	}

	return (
		<div className="container mx-auto px-4 py-6">
			<h1 className="font-heading mb-6 text-2xl font-bold">Manage Players</h1>

			{isLoading ? (
				<div className="space-y-6">
					<div>
						<Skeleton className="mb-3 h-10 w-36" />
						<div className="space-y-2">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					</div>

					<div>
						<Skeleton className="mb-3 h-10 w-36" />
						<div className="space-y-2">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					</div>
				</div>
			) : (
				<div className="space-y-8">
					{teams?.map((team: Team) => (
						<div key={team.id}>
							<div className="mb-3 flex items-center justify-between">
								<h2
									className="font-heading border-b-2 pb-2 text-xl font-bold"
									style={{ borderColor: team.colorCode, flex: 1 }}
								>
									{team.name}
								</h2>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleAddPlayerForTeam(team.id)}
									className="ml-4"
								>
									<UserPlus className="mr-1 h-4 w-4" />
									Add Player
								</Button>
							</div>

							<div className="divide-y">
								{playersByTeam?.[team.id]?.map((player: Player) => {
									// Convert hex color to rgba with alpha 0.05
									const teamColor = team.colorCode ? `${team.colorCode}0D` : 'transparent';
									const hexToRgba = (hex: string, alpha: number = 0.05) => {
										const r = parseInt(hex.slice(1, 3), 16);
										const g = parseInt(hex.slice(3, 5), 16);
										const b = parseInt(hex.slice(5, 7), 16);
										return `rgba(${r}, ${g}, ${b}, ${alpha})`;
									};

									return (
										<div
											key={player.id}
											className="mb-1 flex items-center justify-between rounded-md px-3 py-3"
											style={{ backgroundColor: hexToRgba(team.colorCode) }}
										>
											<div className="flex items-center">
												<span className="font-medium">{player.name}</span>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleEditPlayer(player)}
													className="ml-2 h-auto p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDeletePlayer(player.id)}
													className="ml-1 h-auto p-1 text-red-500 hover:bg-red-100 hover:text-red-700"
												>
													<Trash className="h-4 w-4" />
												</Button>
											</div>
											<div className="flex items-center space-x-3">
												<div className="text-muted-foreground text-sm">Record:</div>
												<span
													className={`rounded-md px-3 py-1 font-mono text-white ${
														player.wins > player.losses
															? 'bg-green-600'
															: player.losses > player.wins
																? 'bg-red-600'
																: 'bg-gray-500'
													}`}
												>
													{player.wins}-{player.losses}-{player.ties}
												</span>
												{player.wins + player.losses + player.ties > 0 && (
													<div className="text-muted-foreground text-xs">
														{(
															(player.wins / (player.wins + player.losses + player.ties)) *
															100
														).toFixed(0)}
														%
													</div>
												)}
											</div>
										</div>
									);
								})}
								{(!playersByTeam?.[team.id] || playersByTeam?.[team.id]?.length === 0) && (
									<div className="text-muted-foreground py-4 text-center">
										No players in this team
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add Player Dialog */}
			{isAddDialogOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="bg-background max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg p-6 shadow-lg">
						<h2 className="mb-4 text-xl font-bold">Add New Player</h2>
						<form onSubmit={handlePlayerFormSubmit}>
							<div className="space-y-4">
								<div>
									<label className="mb-1 block text-sm font-medium">Player Name</label>
									<input
										type="text"
										name="name"
										value={playerFormData.name}
										onChange={handlePlayerInputChange}
										className="w-full rounded-md border px-3 py-2"
										required
									/>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium">Team</label>
									<select
										name="teamId"
										value={playerFormData.teamId}
										onChange={handlePlayerInputChange}
										className="w-full rounded-md border px-3 py-2"
										required
										disabled={true}
									>
										{teams?.map((team) => (
											<option key={team.id} value={team.id}>
												{team.name}
											</option>
										))}
									</select>
								</div>

								{/* Handicap fields removed - now managed per course via match scorecard */}
							</div>

							<div className="mt-6 flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={addPlayerMutation.isPending}>
									{addPlayerMutation.isPending ? (
										<span className="flex items-center">
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
											Adding...
										</span>
									) : (
										'Add Player'
									)}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Player Dialog */}
			{isEditDialogOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="bg-background max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg p-6 shadow-lg">
						<h2 className="mb-4 text-xl font-bold">Edit Player</h2>
						<form onSubmit={handlePlayerFormSubmit}>
							<div className="space-y-4">
								<div>
									<label className="mb-1 block text-sm font-medium">Player Name</label>
									<input
										type="text"
										name="name"
										value={playerFormData.name}
										onChange={handlePlayerInputChange}
										className="w-full rounded-md border px-3 py-2"
										required
									/>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium">Team</label>
									<select
										name="teamId"
										value={playerFormData.teamId}
										onChange={handlePlayerInputChange}
										className="w-full rounded-md border px-3 py-2"
										required
									>
										{teams?.map((team) => (
											<option key={team.id} value={team.id}>
												{team.name}
											</option>
										))}
									</select>
								</div>

								{/* Handicap fields removed - now managed per course via match scorecard */}

								<div className="grid grid-cols-3 gap-4">
									<div>
										<label className="mb-1 block text-sm font-medium">Wins</label>
										<input
											type="number"
											name="wins"
											value={playerFormData.wins}
											onChange={handlePlayerInputChange}
											className="w-full rounded-md border px-3 py-2"
											min="0"
										/>
									</div>

									<div>
										<label className="mb-1 block text-sm font-medium">Losses</label>
										<input
											type="number"
											name="losses"
											value={playerFormData.losses}
											onChange={handlePlayerInputChange}
											className="w-full rounded-md border px-3 py-2"
											min="0"
										/>
									</div>

									<div>
										<label className="mb-1 block text-sm font-medium">Ties</label>
										<input
											type="number"
											name="ties"
											value={playerFormData.ties}
											onChange={handlePlayerInputChange}
											className="w-full rounded-md border px-3 py-2"
											min="0"
										/>
									</div>
								</div>
							</div>

							<div className="mt-6 flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={updatePlayerMutation.isPending}>
									{updatePlayerMutation.isPending ? (
										<span className="flex items-center">
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
											Updating...
										</span>
									) : (
										'Update Player'
									)}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Player</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this player? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeletePlayer}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default AdminPlayersPage;
