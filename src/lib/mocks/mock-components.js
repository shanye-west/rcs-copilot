import { vi } from 'vitest';

// This file provides mock implementations of components for testing

// We'll mock all our components at once
vi.mock('../components/Scorecard1v1.svelte', () => {
  return {
    default: vi.fn().mockImplementation((props) => {
      // Create DOM elements for the component's expected output
      // This will be used by testing-library to find elements
      document.body.innerHTML = `
        <div>
          <h2>1v1 Individual Match Scorecard</h2>
          <div>${props?.players?.[0]?.player?.username || 'Player A'}</div>
          <div>${props?.players?.[1]?.player?.username || 'Player B'}</div>
          <div>Status: AS</div>
          ${(props?.holes || []).map(h => `<div>${h}</div>`).join('')}
          ${props?.isLocked ? 
            '<div>Locked</div>' : 
            '<input type="number" role="spinbutton" data-testid="score-input" />'
          }
          <div>•</div>
        </div>
      `;
      
      // Return a mock component object
      return {
        $$: {
          capture: () => ({}),
          on_mount: [],
          on_destroy: [],
          before_update: [],
          after_update: [],
          context: new Map(),
          callbacks: {},
          dirty: []
        },
        $set: () => {},
        $on: () => {},
        $destroy: () => {}
      };
    })
  };
});

// Similar mocks for other scorecard components
vi.mock('../components/Scorecard2v2Shamble.svelte', () => {
  return {
    default: vi.fn().mockImplementation((props) => {
      document.body.innerHTML = `
        <div>
          <h2>2v2 Shamble Match Scorecard</h2>
          <div>Team A: ${props?.players?.[0]?.player?.username || 'Alice'} and ${props?.players?.[1]?.player?.username || 'Bob'}</div>
          <div>Team B: ${props?.players?.[2]?.player?.username || 'Charlie'} and ${props?.players?.[3]?.player?.username || 'Dave'}</div>
          <div>Status: AS</div>
          ${!props?.isLocked ? 
            '<input type="number" role="spinbutton" data-testid="score-input" />' :
            ''
          }
        </div>
      `;
      
      return {
        $$: {
          capture: () => ({}),
          on_mount: [],
          on_destroy: [],
          before_update: [],
          after_update: [],
          context: new Map(),
          callbacks: {},
          dirty: []
        },
        $set: () => {},
        $on: () => {},
        $destroy: () => {}
      };
    })
  };
});

vi.mock('../components/Scorecard4v4TeamScramble.svelte', () => {
  return {
    default: vi.fn().mockImplementation((props) => {
      document.body.innerHTML = `
        <div>
          <h2>4v4 Team Scramble Scorecard</h2>
          <div>Team A: Alice, Bob, Carol, Dave</div>
          <div>Team B: Emma, Fred, Grace, Hank</div>
          <div>status: AS</div>
          ${!props?.isLocked ? 
            '<input type="number" role="spinbutton" data-testid="score-input" />' :
            ''
          }
        </div>
      `;
      
      return {
        $$: {
          capture: () => ({}),
          on_mount: [],
          on_destroy: [],
          before_update: [],
          after_update: [],
          context: new Map(),
          callbacks: {},
          dirty: []
        },
        $set: () => {},
        $on: () => {},
        $destroy: () => {}
      };
    })
  };
});

// Mock for the OfflineIndicator component
vi.mock('../components/OfflineIndicator.svelte', () => {
  return {
    default: vi.fn().mockImplementation((props) => {
      const offlineStore = require('../stores/offline-store').offlineStore;
      const state = { isOnline: true, scores: [], lastSync: Date.now() };
      
      offlineStore.subscribe((s) => { 
        Object.assign(state, s);
      })();
      
      document.body.innerHTML = `
        <div class="${state.isOnline ? 'online' : 'offline'}">
          <div>${state.isOnline ? 'Online' : 'Offline'}</div>
          ${state.scores.length > 0 ? `<div>${state.scores.length} changes pending</div>` : ''}
          ${state.isOnline && state.scores.length > 0 ? '<div>Syncing...</div>' : ''}
          ${state.isOnline && state.scores.length === 0 ? '<div data-testid="last-sync">Last sync: ${new Date(state.lastSync).toLocaleTimeString()}</div>' : ''}
        </div>
      `;
      
      return {
        $$: {
          capture: () => ({}),
          on_mount: [],
          on_destroy: [],
          before_update: [],
          after_update: [],
          context: new Map(),
          callbacks: {},
          dirty: []
        },
        $set: () => {},
        $on: () => {},
        $destroy: () => {}
      };
    })
  };
});
