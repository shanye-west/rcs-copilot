import { describe, test, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import Scorecard1v1 from '../components/Scorecard1v1.svelte';

// Mock svelte's mount function
beforeAll(() => {
	vi.mock('svelte', async () => {
		const actual = await vi.importActual('svelte');
		return {
			...actual,
			mount: vi.fn().mockImplementation(() => ({ destroy: vi.fn() }))
		};
	});
});

describe('Scorecard1v1 Component', () => {
	// Mock data
	const mockPlayers = [
		{
			player: {
				id: 'player1',
				username: 'Alice',
				handicap: 5,
				handicap_strokes: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
			},
			player_id: 'player1',
			team_id: 'team1',
			scores: { 1: 4, 2: 5 }
		},
		{
			player: {
				id: 'player2',
				username: 'Bob',
				handicap: 10,
				handicap_strokes: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0]
			},
			player_id: 'player2',
			team_id: 'team2',
			scores: { 1: 5, 2: 4 }
		}
	];

	const mockScores = [
		{ player_id: 'player1', hole_number: 1, net_score: 4, gross_score: 4 },
		{ player_id: 'player1', hole_number: 2, net_score: 5, gross_score: 5 },
		{ player_id: 'player2', hole_number: 1, net_score: 5, gross_score: 5 },
		{ player_id: 'player2', hole_number: 2, net_score: 4, gross_score: 4 }
	];

	const mockHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	const mockSaveScore = vi.fn();

	test('renders correctly with player names', () => {
		render(Scorecard1v1, {
			props: {
				players: mockPlayers,
				scores: mockScores,
				holes: mockHoles,
				isLocked: false,
				saveScore: mockSaveScore
			}
		});

		// Check that player names are displayed
		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();

		// Check that the title is displayed
		expect(screen.getByText('1v1 Individual Match Scorecard')).toBeInTheDocument();

		// Check that the holes are displayed
		expect(screen.getByText('1')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	test('displays match status correctly', () => {
		render(Scorecard1v1, {
			props: {
				players: mockPlayers,
				scores: mockScores,
				holes: mockHoles,
				isLocked: false,
				saveScore: mockSaveScore
			}
		});

		// With the mock data, should be "AS" (all square)
		expect(screen.getByText('Status: AS')).toBeInTheDocument();
	});

	test('allows score entry when not locked', async () => {
		render(Scorecard1v1, {
			props: {
				players: mockPlayers,
				scores: mockScores,
				holes: mockHoles,
				isLocked: false,
				saveScore: mockSaveScore
			}
		});

		// Find input fields
		const inputs = screen.getAllByRole('spinbutton');

		// Change a score
		await fireEvent.input(inputs[0], { target: { value: '3' } });
		await fireEvent.change(inputs[0], { target: { value: '3' } });

		// Verify saveScore was called
		expect(mockSaveScore).toHaveBeenCalled();
	});

	test('disables score entry when locked', () => {
		render(Scorecard1v1, {
			props: {
				players: mockPlayers,
				scores: mockScores,
				holes: mockHoles,
				isLocked: true,
				saveScore: mockSaveScore
			}
		});

		// Check that scorecard is in read-only mode (no input fields)
		const inputs = screen.queryAllByRole('spinbutton');
		expect(inputs.length).toBe(0);
	});

	test('handles handicap dots correctly', () => {
		render(Scorecard1v1, {
			props: {
				players: mockPlayers,
				scores: mockScores,
				holes: mockHoles,
				isLocked: false,
				saveScore: mockSaveScore
			}
		});

		// Check for dots in the dots row
		const dotsElements = screen.getAllByText(/^•+$/);
		expect(dotsElements.length).toBeGreaterThan(0);
	});
});
