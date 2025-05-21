import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
  const matchId = params.matchId;
  console.log('Starting load function for match ID:', matchId);

  // Fetch match details
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();
  
  if (matchError || !match) {
    console.error('Match fetch error:', matchError);
    throw error(404, 'Match not found');
  }
  
  console.log('Match fetched successfully:', match);

  // Fetch teams
  const { data: teams } = await supabase.from('teams').select('*');
  console.log('Teams fetched:', teams?.length || 0);

  // Fetch match type
  const { data: matchType } = await supabase
    .from('match_types')
    .select('*')
    .eq('id', match.match_type_id)
    .single();
  
  console.log('Match type:', matchType?.name);

  // Fetch raw match players
  const { data: matchPlayers, error: matchPlayersError } = await supabase
    .from('match_players')
    .select('*')
    .eq('match_id', matchId);

  if (matchPlayersError) {
    console.error('Error fetching match players:', matchPlayersError);
  }
  
  console.log('Match players fetched:', matchPlayers?.length || 0);
  if (matchPlayers && matchPlayers.length > 0) {
    console.log('First match player:', matchPlayers[0]);
    console.log('Team IDs present:', [...new Set(matchPlayers.map(mp => mp.team_id))]);
  }

  // Fetch player details in a separate query
  let playerDetails = [];
  if (matchPlayers && matchPlayers.length > 0) {
    const playerIds = matchPlayers.map(mp => mp.player_id);
    console.log('Player IDs to fetch:', playerIds);
    
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('id', playerIds);
      
    if (playersError) {
      console.error('Error fetching players:', playersError);
    } else {
      playerDetails = players || [];
      console.log('Player details fetched:', playerDetails.length);
      if (playerDetails.length > 0) {
        console.log('First player detail:', playerDetails[0]);
      } else {
        console.log('NO PLAYER DETAILS FOUND!');
        
        // Check if the players table exists and has records
        const { data: samplePlayers } = await supabase
          .from('players')
          .select('*')
          .limit(1);
        
        console.log('Sample player from players table:', samplePlayers);
      }
    }
  }
  
  // Combine match players with their details
  const enhancedMatchPlayers = matchPlayers ? matchPlayers.map(mp => {
    const playerDetail = playerDetails.find(p => p.id === mp.player_id);
    return {
      ...mp,
      player: playerDetail || null,
      username: playerDetail?.username || null,
      full_name: playerDetail?.full_name || null
    };
  }) : [];
  
  console.log('Enhanced match players created:', enhancedMatchPlayers.length);

  // IMPORTANT: Find unique team IDs
  const uniqueTeamIds = [...new Set(matchPlayers?.map(mp => mp.team_id) || [])];
  console.log('Unique team IDs:', uniqueTeamIds);
  
  // Group players by team
  // IMPORTANT: Create new arrays for each team
  let teamAPlayers = [];
  let teamBPlayers = [];
  
  if (uniqueTeamIds.length >= 1) {
    const teamAId = uniqueTeamIds[0];
    console.log('Using team A ID:', teamAId);
    
    // Filter players with this team ID
    teamAPlayers = enhancedMatchPlayers.filter(mp => mp.team_id === teamAId);
    console.log('Team A players count after filter:', teamAPlayers.length);
    
    if (uniqueTeamIds.length >= 2) {
      const teamBId = uniqueTeamIds[1];
      console.log('Using team B ID:', teamBId);
      
      // Filter players with this team ID
      teamBPlayers = enhancedMatchPlayers.filter(mp => mp.team_id === teamBId);
      console.log('Team B players count after filter:', teamBPlayers.length);
    }
  }

  console.log('Final Team A count:', teamAPlayers.length);
  console.log('Final Team B count:', teamBPlayers.length);

  // Add debug info
  const debugInfo = {
    matchId,
    matchPlayersReceived: matchPlayers?.length || 0,
    playerDetailsReceived: playerDetails.length,
    enhancedPlayersCount: enhancedMatchPlayers.length,
    hasMatchPlayersError: !!matchPlayersError,
    uniqueTeamIds,
    teamACount: teamAPlayers.length,
    teamBCount: teamBPlayers.length
  };

  // Fetch scores for this match
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('match_id', matchId);

  // IMPORTANT: Double check what we're returning
  const result = { 
    match, 
    teams, 
    matchType, 
    matchPlayers: enhancedMatchPlayers, 
    teamAPlayers, 
    teamBPlayers, 
    scores,
    debugInfo,
    rawMatchPlayers: matchPlayers
  };
  
  console.log('Returning result with team A players:', result.teamAPlayers.length);
  console.log('Returning result with team B players:', result.teamBPlayers.length);

  return result;
};