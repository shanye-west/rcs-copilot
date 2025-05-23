export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			bets: {
				Row: {
					id: string;
					creator_id: string;
					opponent_id: string | null;
					amount: number;
					description: string;
					status: string;
					is_paid: boolean;
					resolution_type: string;
					match_id: string | null;
					round_id: string | null;
					tournament_id: string | null;
					winner_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					creator_id: string;
					opponent_id?: string | null;
					amount: number;
					description: string;
					status?: string;
					is_paid?: boolean;
					resolution_type: string;
					match_id?: string | null;
					round_id?: string | null;
					tournament_id?: string | null;
					winner_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					creator_id?: string;
					opponent_id?: string | null;
					amount?: number;
					description?: string;
					status?: string;
					is_paid?: boolean;
					resolution_type?: string;
					match_id?: string | null;
					round_id?: string | null;
					tournament_id?: string | null;
					winner_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			match_players: {
				Row: {
					id: string;
					match_id: string;
					player_id: string;
					team_id: string;
					created_at?: string;
				};
				Insert: {
					id?: string;
					match_id: string;
					player_id: string;
					team_id: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					match_id?: string;
					player_id?: string;
					team_id?: string;
					created_at?: string;
				};
			};
			match_types: {
				Row: {
					id: string;
					name: string;
					description?: string;
					created_at?: string;
				};
				Insert: {
					id?: string;
					name: string;
					description?: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					description?: string;
					created_at?: string;
				};
			};
			matches: {
				Row: {
					id: string;
					round_id: string;
					match_type_id: string;
					status: string;
					is_locked: boolean;
					created_at?: string;
				};
				Insert: {
					id?: string;
					round_id: string;
					match_type_id: string;
					status?: string;
					is_locked?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					round_id?: string;
					match_type_id?: string;
					status?: string;
					is_locked?: boolean;
					created_at?: string;
				};
			};
			players: {
				Row: {
					id: string;
					username: string;
					full_name: string;
					is_admin: boolean;
					handicap?: number;
					handicap_strokes?: number[];
					created_at?: string;
				};
				Insert: {
					id?: string;
					username: string;
					full_name: string;
					is_admin?: boolean;
					handicap?: number;
					handicap_strokes?: number[];
					created_at?: string;
				};
				Update: {
					id?: string;
					username?: string;
					full_name?: string;
					is_admin?: boolean;
					handicap?: number;
					handicap_strokes?: number[];
					created_at?: string;
				};
			};
			rounds: {
				Row: {
					id: string;
					tournament_id: string;
					name: string;
					sequence: number;
					created_at?: string;
				};
				Insert: {
					id?: string;
					tournament_id: string;
					name: string;
					sequence?: number;
					created_at?: string;
				};
				Update: {
					id?: string;
					tournament_id?: string;
					name?: string;
					sequence?: number;
					created_at?: string;
				};
			};
			scores: {
				Row: {
					id: string;
					match_id: string;
					player_id: string;
					team: string;
					hole_number: number;
					gross_score?: number;
					net_score?: number;
					created_at?: string;
				};
				Insert: {
					id?: string;
					match_id: string;
					player_id: string;
					team: string;
					hole_number: number;
					gross_score?: number;
					net_score?: number;
					created_at?: string;
				};
				Update: {
					id?: string;
					match_id?: string;
					player_id?: string;
					team?: string;
					hole_number?: number;
					gross_score?: number;
					net_score?: number;
					created_at?: string;
				};
			};
			team_players: {
				Row: {
					team_id: string;
					player_id: string;
					tournament_id: string;
					created_at?: string;
				};
				Insert: {
					team_id: string;
					player_id: string;
					tournament_id: string;
					created_at?: string;
				};
				Update: {
					team_id?: string;
					player_id?: string;
					tournament_id?: string;
					created_at?: string;
				};
			};
			teams: {
				Row: {
					id: string;
					name: string;
					color?: string;
					created_at?: string;
				};
				Insert: {
					id?: string;
					name: string;
					color?: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					color?: string;
					created_at?: string;
				};
			};
			tournaments: {
				Row: {
					id: string;
					name: string;
					is_active: boolean;
					created_at?: string;
				};
				Insert: {
					id?: string;
					name: string;
					is_active?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					is_active?: boolean;
					created_at?: string;
				};
			};
		};
		Views: {
			/**
			 * match_scores: View for aggregated scores per match/player/hole, joining with match and player info.
			 * This is a view, not a table. See match_scores_view.sql for definition.
			 * Used for frontend queries that require player and match context with each score.
			 */
			match_scores: {
				Row: {
					score_id: string;
					match_id: string;
					player_id: string;
					team: string;
					hole_number: number;
					gross_score?: number;
					net_score?: number;
					score_created_at?: string;
					round_id: string;
					tournament_id: string;
					player_name: string;
				};
			};
		};
	};
}
