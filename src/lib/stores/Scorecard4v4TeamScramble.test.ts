import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import Scorecard4v4TeamScramble from '../components/Scorecard4v4TeamScramble.svelte';

describe('Scorecard4v4TeamScramble Component', () => {
  // Mock data
  const mockTeamAPlayers = [
    {
      player_id: 'player1',
      team_id: 'teamA',
      player: {
        id: 'player1',
        username: 'Alice',
        handicap: 5
      }
    },
    {
      player_id: 'player2',
      team_id: 'teamA',
      player: {
        id: 'player2',
        username: 'Bob',
        handicap: 10
      }
    },
    {
      player_id: 'player3',
      team_id: 'teamA',
      player: {
        id: 'player3',
        username: 'Carol',
        handicap: 12
      }
    },
    {
      player_id: 'player4',
      team_id: 'teamA',
      player: {
        id: 'player4',
        username: 'Dave',
        handicap: 14
      }
    }
  ];

  const mockTeamBPlayers = [
    {
      player_id: 'player5',
      team_id: 'teamB',
      player: {
        id: 'player5',
        username: 'Eve',
        handicap: 7
      }
    },
    {
      player_id: 'player6',
      team_id: 'teamB',
      player: {
        id: 'player6',
        username: 'Fred',
        handicap: 9
      }
    },
    {
      player_id: 'player7',
      team_id: 'teamB',
      player: {
        id: 'player7',
        username: 'Grace',
        handicap: 11
      }
    },
    {
      player_id: 'player8',
      team_id: 'teamB',
      player: {
        id: 'player8',
        username: 'Hank',
        handicap: 13
      }
    }
  ];

  const mockTeamScores = [
    { team_id: 'teamA', hole_number: 1, score: 4 },
    { team_id: 'teamA', hole_number: 2, score: 5 },
    { team_id: 'teamB', hole_number: 1, score: 5 },
    { team_id: 'teamB', hole_number: 2, score: 4 }
  ];

  const mockHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const mockSaveScore = vi.fn();

  test('renders correctly with team names and players', () => {
    render(Scorecard4v4TeamScramble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        teamScores: mockTeamScores,
        holes: mockHoles,
        isLocked: false,
        saveTeamScore: mockSaveScore
      }
    });

    // Check for player names
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
    expect(screen.getByText('Dave')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.getByText('Fred')).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(screen.getByText('Hank')).toBeInTheDocument();
    
    // Check for title
    expect(screen.getByText(/4v4 Team Scramble/i)).toBeInTheDocument();
  });

  test('displays team scores correctly', () => {
    render(Scorecard4v4TeamScramble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        teamScores: mockTeamScores,
        holes: mockHoles,
        isLocked: false,
        saveTeamScore: mockSaveScore
      }
    });

    // Check that team scores are displayed
    const teamAScore1 = screen.getByTestId('team-a-score-1');
    const teamBScore1 = screen.getByTestId('team-b-score-1');
    
    expect(teamAScore1).toHaveValue('4');
    expect(teamBScore1).toHaveValue('5');
  });

  test('allows score entry when not locked', async () => {
    render(Scorecard4v4TeamScramble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        teamScores: mockTeamScores,
        holes: mockHoles,
        isLocked: false,
        saveTeamScore: mockSaveScore
      }
    });

    // Find input fields for team scores
    const teamScoreInput = screen.getByTestId('team-a-score-3');
    
    // Change a score
    await fireEvent.input(teamScoreInput, { target: { value: '3' } });
    await fireEvent.change(teamScoreInput, { target: { value: '3' } });
    await fireEvent.blur(teamScoreInput);
    
    // Verify saveTeamScore was called
    expect(mockSaveScore).toHaveBeenCalled();
    expect(mockSaveScore).toHaveBeenCalledWith('teamA', 3, 3);
  });

  test('prevents score entry when locked', async () => {
    render(Scorecard4v4TeamScramble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        teamScores: mockTeamScores,
        holes: mockHoles,
        isLocked: true, // Match is locked
        saveTeamScore: mockSaveScore
      }
    });

    // Find input field
    const teamScoreInput = screen.getByTestId('team-a-score-3');
    
    // Try to change a score
    await fireEvent.input(teamScoreInput, { target: { value: '3' } });
    await fireEvent.change(teamScoreInput, { target: { value: '3' } });
    await fireEvent.blur(teamScoreInput);
    
    // Verify saveTeamScore was not called
    expect(mockSaveScore).not.toHaveBeenCalled();
  });

  test('calculates match status correctly', () => {
    render(Scorecard4v4TeamScramble, {
      props: {
        teamAPlayers: mockTeamAPlayers,
        teamBPlayers: mockTeamBPlayers,
        teamScores: mockTeamScores,
        holes: mockHoles,
        isLocked: false,
        saveTeamScore: mockSaveScore
      }
    });

    // With our mock data (teams tied after 2 holes), should show "AS" or equivalent
    const statusElement = screen.getByText(/status/i);
    expect(statusElement.textContent).toMatch(/AS|even|all square/i);
  });
});
