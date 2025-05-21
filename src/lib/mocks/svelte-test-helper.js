import { render } from '@testing-library/svelte';

// Helper to render Svelte components with default props for testing
export function renderComponent(Component, options = {}) {
  // Create a mock container to hold rendered content
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Define default options
  const defaultOptions = {
    container,
    props: {}
  };

  // Merge with provided options
  const renderOptions = { ...defaultOptions, ...options };

  // Use testing-library's render function
  const result = render(Component, renderOptions);

  // Return both the result and the container
  return {
    ...result,
    container,
    rerender: (newProps) => render(Component, {
      ...renderOptions,
      props: { ...renderOptions.props, ...newProps }
    })
  };
}

// Helper to create testing data for different scorecard types
export const testingData = {
  // Mock data for 1v1 matches
  scorecard1v1: {
    mockPlayers: [
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
    ],
    mockScores: [
      { player_id: 'player1', hole_number: 1, net_score: 4, gross_score: 4 },
      { player_id: 'player1', hole_number: 2, net_score: 5, gross_score: 5 },
      { player_id: 'player2', hole_number: 1, net_score: 5, gross_score: 5 },
      { player_id: 'player2', hole_number: 2, net_score: 4, gross_score: 4 }
    ],
    mockHoles: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  },
  
  // Mock data for team matches can be added here
};
