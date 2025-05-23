import { useLocation } from 'wouter';
import aviatorsLogo from '../assets/Aviators.svg';
import producersLogo from '../assets/Producers.svg';

interface RoundHeaderProps {
	id: number;
	name: string;
	matchType: string;
	courseName: string;
	startTime: string;
	aviatorScore: number;
	producerScore: number;
	pendingAviatorScore?: number;
	pendingProducerScore?: number;
	date: string;
	matchCount: number;
}

const RoundHeader = ({
	id,
	name,
	matchType,
	courseName,
	startTime,
	aviatorScore,
	producerScore,
	pendingAviatorScore = 0,
	pendingProducerScore = 0,
	date,
	matchCount
}: RoundHeaderProps) => {
	const [_, navigate] = useLocation();

	const handleBackClick = () => {
		navigate('/');
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
				Back to Tournament
			</button>

			<div className="overflow-hidden rounded-lg bg-white shadow-md">
				<div className="bg-gray-800 px-4 py-3 text-white">
					<h2 className="font-heading text-xl font-bold">{name}</h2>
					<p className="mt-1 text-sm font-medium text-gray-300">{courseName}</p>
					<p className="text-sm text-gray-300">{matchType}</p>
				</div>

				<div className="p-4">
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center">
							<img src={aviatorsLogo} alt="Aviators" className="mr-5 h-20 w-20" />
							<div className="relative">
								<span className="font-heading text-3xl font-bold">{aviatorScore}</span>
								{pendingAviatorScore > 0 && (
									<span
										className="absolute -right-15.5 bottom-0 text-sm font-normal text-gray-400"
										style={{ marginRight: '10px' }}
										title="Pending points"
									>
										+{pendingAviatorScore}
									</span>
								)}
							</div>
						</div>

						<div className="flex items-center">
							<div className="relative">
								<span className="font-heading text-3xl font-bold">{producerScore}</span>
								{pendingProducerScore > 0 && (
									<span
										className="absolute bottom-0 -left-11 text-sm font-normal text-gray-400"
										style={{ marginLeft: '10px' }}
										title="Pending points"
									>
										+{pendingProducerScore}
									</span>
								)}
							</div>
							<img src={producersLogo} alt="Producers" className="ml-5 h-20 w-20" />
						</div>
					</div>

					<div className="text-center text-sm text-gray-500">
						<p>
							{date} • {startTime}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RoundHeader;
