import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import Scorecard2v2Shamble from '../components/Scorecard2v2Shamble.svelte';

describe('Scorecard2v2Shamble Component', () => {
  // Mock data
  const mockTeamAPlayers = [
    {
      player_id: 'player1',
      team_id: 'teamA',
      player: {
        id: 'player1',
        username: 'Alice',
        handicap: 5,
        handicap_strokes: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
      },
      scores: { 1: 4, 2: 5 }
    },
    {
      player_id: 'player2',
      team_id: 'teamA',
      player: {
        id: 'player2',
        username: 'Bob',
        handicap: 10,
        handicap_strokes: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0]
      },
      scores: { 1: 5, 2: 4 }
    }
  ];

  const mockTeamBPlayers = [
    {
      player_id: 'player3',
      team_id: 'teamB',
      player: {
        id: 'player3',
        username: 'Charlie',
        handicap: 8,
        handicap_strokes: [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0]
      },
      scores: { 1: 4, 2: 5 }
    },
    {
      player_id: 'player4',
      team_id: 'teamB',
      player: {
        id: 'player4',
        username: 'Dave',
        handicap: 12,
        handicap_strokes: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0]
      },
      scores: { 1: 5, 2: 4 }
    }
  ];

  const mockScores = [
    { player_id: 'player1', hole_number: 1, net_score: 4, gross_score: 4 },
    { player_id: 'player1', hole_number: 2, net_score: 5, gross_score: 5 },
    { player_id: 'player2', hole_number: 1, net_score: 5, gross_score: 5 },
    { player_id: 'player2', hole_number: 2, net_score: 4, gross_score: 4 },
    { player_id: 'player3', hole_number: 1, net_score: 4, gross_score: 4 },
    { player_id: 'player3', hole_number: 2, net_score: 5, gross_score: 5 },
    { player_id: 'player4', hole_number: 1, net_score: 5, gross_score: 5 },
    { player_id: 'player4', hole_number: 2, net_score: 4, gross_score: 4 }
  ];

  const mockHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const mockSaveScore = vi.fn();

  test('renders correctly with team and player names', () => {
    render(Scorecard2v2Shamble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        scores: mockScores,
        holes: mockHoles,
        isLocked: false,
        saveScore: mockSaveScore
      }
    });

    // Check that player names are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Dave')).toBeInTheDocument();
    
    // Check that the title is displayed
    expect(screen.getByText(/2v2 Shamble/i)).toBeInTheDocument();
  });

  test('allows score entry when not locked', async () => {
    render(Scorecard2v2Shamble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        scores: mockScores,
        holes: mockHoles,
        isLocked: false,
        saveScore: mockSaveScore
      }
    });

    // Find input fields (there should be at least one per player per hole shown)
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThan(0);
    
    // Change a score
    await fireEvent.input(inputs[0], { target: { value: '3' } });
    await fireEvent.change(inputs[0], { target: { value: '3' } });
    
    // Verify saveScore was called
    expect(mockSaveScore).toHaveBeenCalled();
  });

  test('prevents score entry when locked', async () => {
    render(Scorecard2v2Shamble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        scores: mockScores,
        holes: mockHoles,
        isLocked: true, // Match is locked
        saveScore: mockSaveScore
      }
    });

    // Find input fields
    const inputs = screen.getAllByRole('spinbutton');
    
    // Try to change a score
    await fireEvent.input(inputs[0], { target: { value: '3' } });
    await fireEvent.change(inputs[0], { target: { value: '3' } });
    
    // Verify saveScore was not called
    expect(mockSaveScore).not.toHaveBeenCalled();
  });

  test('calculates match status correctly', () => {
    // Render with even match scores
    render(Scorecard2v2Shamble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        scores: mockScores,
        holes: mockHoles,
        isLocked: false,
        saveScore: mockSaveScore
      }
    });

    // With our mock data, teams should be even
    const statusElement = screen.getByText(/status/i);
    expect(statusElement).toContainText(/AS|even|all square/i);
  });
});
