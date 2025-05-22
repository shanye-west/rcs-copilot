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
 * If course is provided, use its handicap_per_hole for correct stroke allocation.
 */
export function calculateHandicapDots(
	player: Player['player'],
	hole: number,
	course?: Course
): string {
	// If player has explicit handicap_strokes array, use it
	if (player.handicap_strokes && player.handicap_strokes.length === 18) {
		return player.handicap_strokes[hole - 1] > 0
			? '•'.repeat(player.handicap_strokes[hole - 1])
			: '';
	}

	const handicap = player.handicap || 0;
	if (handicap === 0) return '';

	// Use course handicap allocation if available
	let strokeIndex = hole;
	if (course && course.handicap_per_hole && course.handicap_per_hole.length === 18) {
		// Find the index for this hole (1-based)
		strokeIndex = course.handicap_per_hole[hole - 1];
	}

	let dots = 0;
	if (handicap >= 18) {
		dots = 1;
		if (handicap - 18 >= 18 - strokeIndex + 1) {
			dots = 2;
		} else if (handicap - 18 > 0 && strokeIndex <= handicap - 18) {
			dots = 2;
		}
	} else if (handicap > 0 && strokeIndex <= handicap) {
		dots = 1;
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
