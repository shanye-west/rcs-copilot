import { useQuery, useMutation } from '@tanstack/react-query';
import TournamentScore from '@/components/TournamentScore';
import RoundsList from '@/components/RoundsList';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import rowdyCupLogo from '../assets/rowdy-cup-logo.svg';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Settings, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';

const Home = () => {
	const [_, navigate] = useLocation();
	const { isAdmin } = useAuth();
	const { toast } = useToast();
	const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
	const [isAddRoundDialogOpen, setIsAddRoundDialogOpen] = useState(false);
	const [tournamentFormData, setTournamentFormData] = useState({
		name: ''
	});

	// Define the Course interface
	interface Course {
		id: number;
		name: string;
		location: string;
	}

	// Fetch courses using react-query
	const { data: courses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
		queryKey: ['/api/courses'],
		queryFn: async () => {
			const response = await apiRequest('GET', '/api/courses');
			return response.json();
		}
	});

	useEffect(() => {
		// If we have courses, set the default courseId and courseName
		if (courses.length > 0) {
			setRoundFormData((prev) => ({
				...prev,
				courseId: courses[0].id,
				courseName: courses[0].name
			}));
		}
	}, [courses]);

	const [roundFormData, setRoundFormData] = useState({
		name: '',
		matchType: 'Singles Match',
		courseId: courses.length > 0 ? courses[0].id : 1, // Default value that will be updated when courses are loaded
		courseName: courses.length > 0 ? courses[0].name : '',
		date: new Date().toISOString().split('T')[0],
		startTime: '08:00',
		isComplete: false,
		tournamentId: 1 // Default tournament ID
	});

	// Define types
	interface Tournament {
		id: number;
		name: string;
		aviatorScore: number;
		producerScore: number;
		pendingAviatorScore?: number;
		pendingProducerScore?: number;
	}

	interface Round {
		id: number;
		name: string;
		matchType: string;
		courseName: string;
		startTime: string;
		date: string;
		isComplete: boolean;
		aviatorScore?: number;
		producerScore?: number;
		pendingAviatorScore?: number;
		pendingProducerScore?: number;
	}

	// Fetch tournament data
	const { data: tournament, isLoading: isTournamentLoading } = useQuery<Tournament>({
		queryKey: ['/api/tournament']
	});

	// Fetch rounds data
	const { data: rounds, isLoading: isRoundsLoading } = useQuery<Round[]>({
		queryKey: ['/api/rounds']
	});

	// Tournament update mutation
	const updateTournamentMutation = useMutation({
		mutationFn: async (tournamentData: any) => {
			const { aviatorScore, producerScore, ...safeData } = tournamentData;

			const res = await apiRequest('PUT', `/api/tournament/${tournament?.id}`, safeData);
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
			toast({
				title: 'Tournament updated',
				description: 'Tournament settings have been saved successfully',
				duration: 1000
			});
			setIsTournamentDialogOpen(false);
		},
		onError: (error: Error) => {
			toast({
				title: 'Update failed',
				description: error.message,
				variant: 'destructive',
				duration: 1000
			});
		}
	});

	// Add round mutation
	const addRoundMutation = useMutation({
		mutationFn: async (roundData: any) => {
			const res = await apiRequest('POST', '/api/rounds', roundData);
			return await res.json();
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
			toast({
				title: 'Round added',
				description: 'New round has been added successfully',
				duration: 1000
			});
			setIsAddRoundDialogOpen(false);
			resetRoundForm();
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to add round',
				description: error.message,
				variant: 'destructive',
				duration: 1000
			});
		}
	});

	// Handle form input changes
	const handleTournamentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setTournamentFormData({
			...tournamentFormData,
			[name]: value
		});
	};

	const handleRoundInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target as HTMLInputElement;
		setRoundFormData({
			...roundFormData,
			[name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
		});
	};

	// Form submission handlers
	const handleTournamentFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateTournamentMutation.mutate(tournamentFormData);
	};

	const handleRoundFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validation for course selection
		if (!roundFormData.courseId || isNaN(Number(roundFormData.courseId))) {
			toast({
				title: 'Error',
				description: 'Please select a valid course',
				variant: 'destructive'
			});
			return;
		}

		// Ensure courseId is properly cast to a number
		const formData = {
			...roundFormData,
			courseId: Number(roundFormData.courseId)
		};

		console.log('Submitting round with data:', formData);
		addRoundMutation.mutate(formData);
	};

	// Reset form
	const resetRoundForm = () => {
		// Default to the first course if courses are loaded
		const defaultCourseId = courses && courses.length > 0 ? courses[0].id : 1;
		const defaultCourseName = courses && courses.length > 0 ? courses[0].name : '';

		setRoundFormData({
			name: '',
			matchType: 'Singles Match',
			courseId: defaultCourseId,
			courseName: defaultCourseName,
			date: new Date().toISOString().split('T')[0],
			startTime: '08:00',
			isComplete: false,
			tournamentId: tournament?.id || 1
		});
	};

	// Handle opening edit dialog
	const handleOpenTournamentDialog = () => {
		if (tournament) {
			setTournamentFormData({
				name: tournament.name
			});
		}
		setIsTournamentDialogOpen(true);
	};

	const isLoading = isTournamentLoading || isRoundsLoading;

	// Process rounds data to include scores
	const roundsWithScores =
		rounds?.map((round: Round) => {
			// Get scores for this round from matches
			const aviatorScore = round.aviatorScore || 0;
			const producerScore = round.producerScore || 0;
			const pendingAviatorScore = round.pendingAviatorScore || 0;
			const pendingProducerScore = round.pendingProducerScore || 0;

			return {
				...round,
				aviatorScore,
				producerScore,
				pendingAviatorScore,
				pendingProducerScore
			};
		}) || [];

	return (
		<div className="container mx-auto px-4 py-6">
			{isLoading ? (
				<>
					<div className="mb-6">
						<Skeleton className="mx-auto mb-4 h-10 w-48" />
						<Skeleton className="mb-2 h-20 w-full" />
					</div>
					<Skeleton className="mb-3 h-8 w-32" />
					<div className="space-y-4">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-24 w-full" />
						))}
					</div>
				</>
			) : (
				<>
					{/* Admin Controls */}
					{isAdmin && (
						<div className="mb-5 flex items-center justify-between">
							<Button
								onClick={handleOpenTournamentDialog}
								variant="outline"
								className="flex items-center space-x-2"
							>
								<Settings className="h-4 w-4" />
								<span>Edit Tournament</span>
							</Button>
							<Button
								onClick={() => setIsAddRoundDialogOpen(true)}
								className="flex items-center space-x-2"
							>
								<Calendar className="h-4 w-4" />
								<span>Add New Round</span>
							</Button>
						</div>
					)}

					{/* Tournament Score */}
					<TournamentScore
						aviatorScore={tournament?.aviatorScore || 0}
						producerScore={tournament?.producerScore || 0}
						pendingAviatorScore={tournament?.pendingAviatorScore || 0}
						pendingProducerScore={tournament?.pendingProducerScore || 0}
					/>

					{/* Rounds List */}
					<div className="mt-6">
						{isAdmin && (
							<div className="mb-3 flex items-center justify-between">
								<h2 className="text-xl font-semibold">Tournament Rounds</h2>
							</div>
						)}
						<RoundsList rounds={roundsWithScores || []} />
					</div>

					{/* Tournament Settings Dialog */}
					{isTournamentDialogOpen && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
							<div className="bg-background max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg p-6 shadow-lg">
								<h2 className="mb-4 text-xl font-bold">Edit Tournament</h2>

								<form onSubmit={handleTournamentFormSubmit}>
									<div className="space-y-4">
										<div>
											<label className="mb-1 block text-sm font-medium">Tournament Name</label>
											<input
												type="text"
												name="name"
												value={tournamentFormData.name}
												onChange={handleTournamentInputChange}
												className="w-full rounded-md border px-3 py-2"
												required
											/>
										</div>
									</div>

									<div className="mt-6 flex justify-end space-x-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setIsTournamentDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button type="submit" disabled={updateTournamentMutation.isPending}>
											{updateTournamentMutation.isPending ? (
												<span className="flex items-center">
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Saving...
												</span>
											) : (
												'Save Changes'
											)}
										</Button>
									</div>
								</form>
							</div>
						</div>
					)}

					{/* Add Round Dialog */}
					{isAddRoundDialogOpen && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
							<div className="bg-background max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg p-6 shadow-lg">
								<h2 className="mb-4 text-xl font-bold">Add New Round</h2>

								<form onSubmit={handleRoundFormSubmit}>
									<div className="space-y-4">
										<div>
											<label className="mb-1 block text-sm font-medium">Round Name</label>
											<input
												type="text"
												name="name"
												value={roundFormData.name}
												onChange={handleRoundInputChange}
												className="w-full rounded-md border px-3 py-2"
												required
											/>
										</div>

										<div>
											<label className="mb-1 block text-sm font-medium">Match Type</label>
											<select
												name="matchType"
												value={roundFormData.matchType}
												onChange={handleRoundInputChange}
												className="w-full rounded-md border px-3 py-2"
												required
											>
												<option value="Singles Match">Singles Match</option>
												<option value="2-man Team Scramble">2-man Team Scramble</option>
												<option value="4-man Team Scramble">4-man Team Scramble</option>
												<option value="2-man Team Shamble">2-man Team Shamble</option>
												<option value="2-man Team Best Ball">2-man Team Best Ball</option>
												<option value="Alternate Shot">Alternate Shot</option>
											</select>
										</div>

										<div>
											<label className="mb-1 block text-sm font-medium">Course</label>

											{isLoadingCourses ? (
												<div className="rounded border p-2">Loading courses...</div>
											) : courses && courses.length > 0 ? (
												<select
													name="courseId"
													value={roundFormData.courseId || ''}
													onChange={(e) => {
														// Update both courseId and courseName
														const courseId = parseInt(e.target.value);
														const selectedCourse = courses.find((course) => course.id === courseId);
														setRoundFormData({
															...roundFormData,
															courseId: courseId,
															courseName: selectedCourse ? selectedCourse.name : '',
															tournamentId: tournament?.id || 1
														});
													}}
													className="w-full rounded-md border px-3 py-2"
													required
												>
													<option value="">Select a course</option>
													{courses.map((course) => (
														<option key={course.id} value={course.id}>
															{course.name} ({course.location})
														</option>
													))}
												</select>
											) : (
												<div className="rounded border p-2 text-red-500">
													No courses available. Please add courses first.
												</div>
											)}

											{/* Debug information */}
											{isAdmin && (
												<div className="mt-1 rounded bg-gray-100 p-2 text-xs">
													<p>Selected course ID: {roundFormData.courseId}</p>
													<p>Selected course name: {roundFormData.courseName}</p>
												</div>
											)}
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="mb-1 block text-sm font-medium">Date</label>
												<input
													type="date"
													name="date"
													value={roundFormData.date}
													onChange={handleRoundInputChange}
													className="w-full rounded-md border px-3 py-2"
													required
												/>
											</div>

											<div>
												<label className="mb-1 block text-sm font-medium">Start Time</label>
												<input
													type="time"
													name="startTime"
													value={roundFormData.startTime}
													onChange={handleRoundInputChange}
													className="w-full rounded-md border px-3 py-2"
													required
												/>
											</div>
										</div>
									</div>

									<div className="mt-6 flex justify-end space-x-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setIsAddRoundDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button type="submit" disabled={addRoundMutation.isPending}>
											{addRoundMutation.isPending ? (
												<span className="flex items-center">
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Adding...
												</span>
											) : (
												'Add Round'
											)}
										</Button>
									</div>
								</form>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default Home;
