/**
 * Utilities for scoring golf matches in the Rowdy Cup app.
 */

export interface Player {
	player: {
		id: string;
		username: string;
		handicap?: number;
		handicap_strokes?: number[];
	};
	player_id: string;
	team_id: string;
	scores?: Record<number, number | string>;
}

export interface Score {
	player_id: string;
	hole_number: number;
	net_score?: number;
	gross_score?: number;
}

export interface Course {
	id: string;
	name: string;
	slope_rating: number;
	course_rating: number;
	par_per_hole: number[]; // 18 values
	handicap_per_hole: number[]; // 18 values, 1=hardest
}

/**
 * Calculate gross scores (used for Scramble and Shamble formats)
 * This represents the actual strokes taken on a hole.
 */
export function calculateGrossScore(
	scores: Score[],
	playerId: string,
	hole: number
): number | undefined {
	return scores.find((s) => s.player_id === playerId && s.hole_number === hole)?.gross_score;
}

/**
 * Calculate net scores (used for Individual and Best Ball formats)
 * Takes handicap into account.
 */
export function calculateNetScore(
	scores: Score[],
	playerId: string,
	hole: number
): number | undefined {
	return scores.find((s) => s.player_id === playerId && s.hole_number === hole)?.net_score;
}

/**
 * Calculate handicap dots for a player on a specific hole, using course data if available.
 * Handicap dots represent the number of strokes a player gets on a specific hole.
 * 
 * In golf, handicap strokes are allocated based on hole difficulty:
 * - For handicaps 1-18: Strokes are given on the X hardest holes (where X is the handicap)
 * - For handicaps > 18: Player gets a stroke on every hole, plus additional strokes
 *   on the hardest holes until all handicap strokes are distributed
 *
 * @param player - The player object containing handicap information
 * @param hole - The hole number (1-based)
 * @param course - Optional course data with hole difficulty ratings
 * @returns A string with dots representing handicap strokes for visualization
 */
export function calculateHandicapDots(
	player: Player['player'],
	hole: number,
	course?: Course
): string {
	// Case 1: If player has explicitly defined handicap strokes per hole, use those
	if (player.handicap_strokes && player.handicap_strokes.length === 18) {
		const strokesForHole = player.handicap_strokes[hole - 1];
		return strokesForHole > 0 ? '•'.repeat(strokesForHole) : '';
	}

	// Case 2: No handicap means no strokes
	const handicap = player.handicap || 0;
	if (handicap === 0) return '';

	// Determine hole difficulty (stroke index)
	// Lower index = harder hole = gets handicap strokes first
	let holeStrokeIndex = hole; // Default: assume holes are numbered by difficulty 
	if (course?.handicap_per_hole?.length === 18) {
		// Use course-specific hole difficulty ranking
		holeStrokeIndex = course.handicap_per_hole[hole - 1];
	}

	// Calculate dots (strokes) for this hole
	let dots = 0;
	
	// First allocation (handicaps 1-18)
	// If hole difficulty index ≤ handicap, player gets a stroke
	if (holeStrokeIndex <= handicap && handicap > 0) {
		dots = 1;
	}
	
	// Second allocation (handicaps > 18)
	// For handicaps above 18, additional strokes are assigned to hardest holes first
	if (handicap > 18) {
		const extraHandicap = handicap - 18;
		
		// If hole's stroke index is less than or equal to the extra handicap,
		// player gets an additional stroke on this hole
		if (holeStrokeIndex <= extraHandicap) {
			dots += 1;
		}
	}

	return dots > 0 ? '•'.repeat(dots) : '';
}

/**
 * Calculate the best net score for a team on a specific hole
 * Used for the Best Ball format.
 */
export function calculateBestNetScore(
	players: Player[],
	scores: Score[],
	hole: number
): number | undefined {
	const netScores = players
		.filter((p) => p && p.player && p.player.id)
		.map((p) => calculateNetScore(scores, p.player.id, hole))
		.filter((score) => score !== undefined)
		.map((score) => Number(score));

	if (netScores.length === 0) return undefined;
	return Math.min(...netScores);
}

/**
 * Calculate match-play status (AS, 1up, etc.) for a 1v1 match
 */
export function calculateMatchStatus(
	playerA: Player,
	playerB: Player,
	scores: Score[],
	holes: number[]
): string {
	let aUp = 0,
		bUp = 0;

	for (let hole of holes) {
		const scoreA = calculateNetScore(scores, playerA.player.id, hole);
		const scoreB = calculateNetScore(scores, playerB.player.id, hole);

		if (scoreA === undefined || scoreB === undefined) continue;

		if (scoreA < scoreB) aUp++;
		else if (scoreB < scoreA) bUp++;
	}

	if (aUp === bUp) return 'AS';
	if (aUp > bUp) return `${aUp - bUp}↑`;
	return `${bUp - aUp}↓`;
}

/**
 * Determine which team is winning on a hole in a team format
 */
export function getWinningTeam(
	teamAScore: number | undefined,
	teamBScore: number | undefined
): 'A' | 'B' | 'tie' | null {
	if (teamAScore === undefined || teamBScore === undefined) return null;

	if (teamAScore < teamBScore) return 'A';
	if (teamBScore < teamAScore) return 'B';
	return 'tie';
}

/**
 * Calculate net score from gross score by applying handicap, using course data if available.
 */
export function applyHandicap(
	grossScore: number,
	player: Player['player'],
	hole: number,
	course?: Course
): number {
	const dots = calculateHandicapDots(player, hole, course).length;
	return grossScore - dots;
}
