import aviatorsLogo from '../assets/aviators-logo.svg';
import producersLogo from '../assets/producers-logo.svg';
import aviatorsText from '../assets/aviators-text.svg';
import producersText from '../assets/producers-text.svg';

interface TournamentScoreProps {
	aviatorScore: number;
	producerScore: number;
	pendingAviatorScore?: number;
	pendingProducerScore?: number;
}

const TournamentScore = ({
	aviatorScore,
	producerScore,
	pendingAviatorScore = 0,
	pendingProducerScore = 0
}: TournamentScoreProps) => {
	return (
		<div className="mb-6 rounded-lg bg-white p-4 shadow-md">
			<div className="flex items-center justify-between">
				<div className="w-5/12 text-center">
					<div className="bg-aviator flex items-center justify-center rounded-t-lg px-6 py-2 text-white">
						<img src={aviatorsLogo} alt="Aviators" className="mr-2 h-7 w-7" />
						<img src={aviatorsText} alt="Aviators" className="h-15 w-15" />
					</div>
					<div className="relative rounded-b-lg border-r-2 border-b-2 border-l-2 border-gray-200 py-4 font-mono text-5xl font-bold">
						{aviatorScore}
						{pendingAviatorScore > 0 && (
							<span
								className="absolute right-2 bottom-1 text-lg font-normal text-gray-400"
								title="Pending points"
							>
								+{pendingAviatorScore}
							</span>
						)}
					</div>
				</div>

				<div className="font-heading text-xl font-bold">VS</div>

				<div className="w-5/12 text-center">
					<div className="bg-producer flex items-center justify-center rounded-t-lg px-6 py-2 text-white">
						<img src={producersLogo} alt="Producers" className="mr-1 h-7 w-7" />
						<img src={producersText} alt="Producers" className="h-15 w-15" />
					</div>
					<div className="relative rounded-b-lg border-r-2 border-b-2 border-l-2 border-gray-200 py-4 font-mono text-5xl font-bold">
						{producerScore}
						{pendingProducerScore > 0 && (
							<span
								className="absolute right-2 bottom-1 text-lg font-normal text-gray-400"
								title="Pending points"
							>
								+{pendingProducerScore}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TournamentScore;
