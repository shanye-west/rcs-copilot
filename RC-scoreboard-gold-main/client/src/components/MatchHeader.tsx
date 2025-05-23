import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import aviatorsLogo from '../assets/aviators-logo.svg';
import producersLogo from '../assets/producers-logo.svg';

interface MatchHeaderProps {
	id: number;
	name: string;
	roundId: number;
	roundName?: string;
	matchType?: string;
	leadingTeam: string | null;
	leadAmount: number;
	currentHole: number;
	status?: string;
	result?: string | null;
}

interface Player {
	id: number;
	name: string;
	teamId: number;
}

interface MatchParticipant {
	userId: number;
	team: string;
	player: Player;
}

const MatchHeader = ({
	id,
	name,
	roundId,
	roundName = 'Round',
	matchType = '',
	leadingTeam,
	leadAmount,
	currentHole,
	status = 'in_progress',
	result = null
}: MatchHeaderProps) => {
	const [_, navigate] = useLocation();

	// Fetch match participants
	const { data: participants = [] } = useQuery<any[]>({
		queryKey: [`/api/match-players?matchId=${id}`]
	});

	// Fetch all players for reference
	const { data: allPlayers = [] } = useQuery<any[]>({
		queryKey: ['/api/players']
	});

	// Split participants into teams - now keeping them as array instead of joining with comma
	const aviatorPlayers = Array.isArray(participants)
		? participants
				.filter((p: any) => p.team === 'aviators')
				.map((p: any) => {
					const player = Array.isArray(allPlayers)
						? allPlayers.find((player: any) => player.id === p.playerId)
						: null;
					return player ? player.name : `Player ${p.playerId}`;
				})
		: [];

	const producerPlayers = Array.isArray(participants)
		? participants
				.filter((p: any) => p.team === 'producers')
				.map((p: any) => {
					const player = Array.isArray(allPlayers)
						? allPlayers.find((player: any) => player.id === p.playerId)
						: null;
					return player ? player.name : `Player ${p.playerId}`;
				})
		: [];

	const handleBackClick = () => {
		navigate(`/rounds/${roundId}`);
	};

	return (
		<div className="mb-6">
			<button
				className="mb-2 flex items-center font-semibold text-blue-600"
				onClick={handleBackClick}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="mr-1 h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
				</svg>
				Back to Round
			</button>

			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<div className="bg-gray-800 px-4 py-3 text-white">
					<h2 className="font-heading text-xl font-bold">{name}</h2>
					<p className="text-sm text-gray-300">
						{matchType} • {roundName}
					</p>
				</div>

				<div className="p-4">
					<div className="mb-3 flex">
						<div className="w-1/2 border-r border-gray-200 pr-3">
							<div className="mb-1 flex items-center">
								<img src={aviatorsLogo} alt="Aviators" className="mr-2 h-5 w-5" />
								<span className="text-sm font-semibold">AVIATORS</span>
							</div>
							<div className="text-sm font-semibold">
								{aviatorPlayers.map((player, index) => (
									<div key={index} className="mb-1 leading-tight">
										{player}
									</div>
								))}
							</div>
						</div>

						<div className="w-1/2 pl-3">
							<div className="mb-1 flex items-center">
								<img src={producersLogo} alt="Producers" className="mr-2 h-5 w-5" />
								<span className="text-sm font-semibold">PRODUCERS</span>
							</div>
							<div className="text-sm font-semibold">
								{producerPlayers.map((player, index) => (
									<div key={index} className="mb-1 leading-tight">
										{player}
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Display final match result when completed */}
					{status === 'completed' && result ? (
						<div className="flex items-center justify-center">
							<div className="font-heading rounded-lg bg-gray-100 px-4 py-2 text-center text-lg font-bold">
								<span className={leadingTeam === 'aviators' ? 'text-aviator' : 'text-producer'}>
									{leadingTeam === 'aviators' ? 'Aviators' : 'Producers'} win {result}
								</span>
							</div>
						</div>
					) : status === 'upcoming' ? (
						<div className="flex items-center justify-center">
							<div className="font-heading rounded-lg bg-gray-100 px-3 py-1 text-center font-bold">
								MATCH PENDING
							</div>
						</div>
					) : leadingTeam ? (
						<div className="flex items-center justify-center">
							<div className="font-heading rounded-lg bg-gray-100 px-3 py-1 text-center font-bold">
								<span className={leadingTeam === 'aviators' ? 'text-aviator' : 'text-producer'}>
									{leadingTeam === 'aviators' ? 'AVIATORS' : 'PRODUCERS'}
								</span>
								<span className="ml-1 rounded bg-white px-2 py-1 font-mono text-sm">
									{leadAmount > 0 ? `${leadAmount} UP` : '-'}
								</span>
							</div>
							<div className="ml-2 text-xs text-gray-500">
								<span>Hole {currentHole}</span>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-center">
							<div className="font-heading rounded-lg bg-gray-100 px-3 py-1 text-center font-bold">
								ALL SQUARE
							</div>
							<div className="ml-2 text-xs text-gray-500">
								<span>Hole {currentHole}</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MatchHeader;
