// Match admin page - load the specific match and all related data for scorecards
import { protectAdminRoute } from '$lib/utils/admin-protection';
import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export async function load(event) {
  // First ensure only admins can access this route
  await protectAdminRoute(event);
  
  const matchId = event.params.matchId;
  
  try {
    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
      
    if (matchError) throw matchError;
    
    // Get teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');
      
    if (teamsError) throw teamsError;
    
    // Get match type
    const { data: matchType, error: matchTypeError } = await supabase
      .from('match_types')
      .select('*')
      .eq('id', match.match_type_id)
      .single();
      
    if (matchTypeError) throw matchTypeError;
    
    // Get match players
    const { data: matchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select('*, player:players(*)')
      .eq('match_id', matchId);
      
    if (matchPlayersError) throw matchPlayersError;
    
    // Get scores
    const { data: scores, error: scoresError } = await supabase
      .from('match_scores')
      .select('*')
      .eq('match_id', matchId);
      
    if (scoresError) throw scoresError;
    
    // Get course if available
    let course = null;
    if (match.course_id) {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', match.course_id)
        .single();
        
      if (!courseError) {
        course = courseData;
      }
    }
    
    return {
      match,
      teams,
      matchType,
      matchPlayers,
      scores: scores || [],
      course,
      error: null
    };
    
  } catch (err) {
    console.error('Error loading match data:', err);
    return {
      match: null,
      teams: [],
      matchType: null,
      matchPlayers: [],
      scores: [],
      course: null,
      error: err.message || 'Failed to load match data'
    };
  }
}
