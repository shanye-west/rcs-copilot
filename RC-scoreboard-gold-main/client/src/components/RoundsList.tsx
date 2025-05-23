import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Unlock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Round {
	id: number;
	name: string;
	matchType: string;
	date: string;
	courseName: string;
	startTime: string;
	aviatorScore: number;
	producerScore: number;
	pendingAviatorScore?: number;
	pendingProducerScore?: number;
	isComplete: boolean;
}

interface RoundsListProps {
	rounds: Round[];
}

const ROUNDS_TO_HIDE = ['Singles Match', 'Alternate Shot'];

const RoundsList = ({ rounds }: RoundsListProps) => {
	const [_, navigate] = useLocation();
	const { isAdmin } = useAuth();
	const { toast } = useToast();
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	const deleteRoundMutation = useMutation({
		mutationFn: async (roundId: number) => {
			const res = await apiRequest('DELETE', `/api/rounds/${roundId}`);
			if (res.ok) {
				return roundId;
			} else {
				const error = await res.json();
				throw new Error(error.message || 'Failed to delete round');
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
			queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
			toast({
				title: 'Round deleted',
				description: 'Round and all associated matches have been deleted successfully',
				duration: 1000
			});
			setConfirmDeleteId(null);
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to delete round',
				description: error.message,
				variant: 'destructive',
				duration: 1000
			});
		}
	});

	const handleRoundClick = (roundId: number) => {
		navigate(`/rounds/${roundId}`);
	};

	const handleDeleteClick = (e: React.MouseEvent, roundId: number) => {
		e.stopPropagation();
		setConfirmDeleteId(roundId);
	};

	const confirmDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirmDeleteId !== null) {
			deleteRoundMutation.mutate(confirmDeleteId);
		}
	};

	const cancelDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		setConfirmDeleteId(null);
	};

	return (
		<div className="space-y-4">
			{rounds
				.filter((round) => !ROUNDS_TO_HIDE.includes(round.matchType)) // Filter out specific round types
				.sort((a, b) => a.id - b.id)
				.map((round) => (
					<div
						key={round.id}
						className="relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-md"
						onClick={() => handleRoundClick(round.id)}
					>
						{isAdmin && (
							<div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
								{confirmDeleteId === round.id ? (
									<div className="flex space-x-1">
										<Button
											size="sm"
											variant="destructive"
											className="h-8 px-2 py-1 text-xs"
											onClick={confirmDelete}
										>
											Confirm
										</Button>
										<Button
											size="sm"
											variant="outline"
											className="h-8 px-2 py-1 text-xs"
											onClick={cancelDelete}
										>
											Cancel
										</Button>
									</div>
								) : (
									<Button
										size="icon"
										variant="ghost"
										className="h-7 w-7"
										onClick={(e) => handleDeleteClick(e, round.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}
						<div className="border-b border-gray-200 bg-gray-100 px-4 py-3">
							<h3 className="font-heading font-bold">{round.name}</h3>
							<p className="text-sm font-medium text-gray-600">{round.courseName}</p>
							<p className="text-sm text-gray-600">{round.matchType}</p>
						</div>
						<div className="p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<div className="bg-aviator mr-2 h-3 w-3 rounded-full"></div>
									<div className="relative">
										<span className="font-semibold">
											{parseFloat(round.aviatorScore.toString())}
										</span>
									</div>
								</div>
								<div className="flex items-center">
									<div className="relative">
										<span className="font-semibold">
											{parseFloat(round.producerScore.toString())}
										</span>
									</div>
									<div className="bg-producer ml-2 h-3 w-3 rounded-full"></div>
								</div>
							</div>
							<div className="mt-2 flex items-center justify-between text-sm text-gray-500">
								<div>{round.date}</div>
								<div>{round.startTime}</div>
							</div>
							{!round.isComplete && (
								<div className="mt-2">
									<span className="inline-block rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
										In Progress
									</span>
								</div>
							)}
						</div>
					</div>
				))}
		</div>
	);
};

export default RoundsList;
