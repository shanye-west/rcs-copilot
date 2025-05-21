/**
 * Utilities to help integrate scorecards with the offline store
 * Provides a consistent way to save scores and monitor sync status
 */
import { get } from 'svelte/store';
import { offlineStore, type OfflineScore } from '$lib/stores/offline-store';

/**
 * Creates a function that saves scores to the offline store
 * @param matchId - The ID of the match this score is for
 * @returns A function that can be passed to scorecard components
 */
export function createScoreSaver(matchId: string) {
  return function saveScore(playerId: string, hole: number, score: number | null) {
    if (!playerId || !matchId) {
      console.error('Cannot save score: missing player ID or match ID');
      return;
    }

    // Only add to offline store if score is not null
    if (score !== null) {
      offlineStore.addScore({
        player_id: playerId,
        hole_number: hole,
        score,
        match_id: matchId
      });
    } else {
      // In a real implementation, we might have a method to delete scores
      // For now we just don't add null scores
      console.log('Skipping null score for hole', hole, 'player', playerId);
    }
  };
}

/**
 * Creates a function that checks sync status in the offline store
 * @param matchId - The ID of the match
 * @returns A function that can be passed to scorecard components
 */
export function createSyncStatusChecker(matchId: string) {
  return function getSyncStatus(playerId: string, hole: number): 'pending' | 'synced' | 'failed' | undefined {
    if (!playerId || !matchId) {
      return undefined;
    }
    
    const state = get(offlineStore);
    
    // Find the latest score entry for this player/hole/match combination
    const scores = state.scores.filter(
      s => s.player_id === playerId && 
           s.hole_number === hole && 
           s.match_id === matchId
    );
    
    if (scores.length === 0) return undefined;
    
    // Sort by timestamp descending to get the most recent score
    scores.sort((a, b) => b.timestamp - a.timestamp);
    
    const latestScore = scores[0];
    
    // Return status based on sync and retry values
    if (latestScore.synced) return 'synced';
    if (latestScore.retry_count > 2) return 'failed';
    return 'pending';
  };
}

/**
 * Simulates a network sync for testing purposes
 * @param matchId - The ID of the match
 */
export function simulateSyncForMatch(matchId: string) {
  const state = get(offlineStore);
  
  // Get all pending scores for this match
  const pendingScores = state.scores.filter(
    s => s.match_id === matchId && !s.synced
  );
  
  // Mark each score as synced
  pendingScores.forEach(score => {
    offlineStore.markSynced(score.player_id, score.hole_number, score.match_id);
  });
}

/**
 * Loads scores from offline store for a specific match
 * @param matchId - The ID of the match
 * @returns Array of scores from the offline store
 */
export function loadOfflineScores(matchId: string): OfflineScore[] {
  const state = get(offlineStore);
  
  // Get all scores for this match (both synced and unsynced)
  return state.scores.filter(s => s.match_id === matchId);
}
