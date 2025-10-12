export interface User {
  id: number;
  sub: string;
  handle: string;
  avatar: string;
  rating: number;
  created_at: Date;
  last_login: Date | null;
}

export interface Battle {
  id: number;
  created_by: number;
  created_at: Date;
  status: "pending" | "in_progress" | "completed";
  title: string;
  start_time: Date;
  duration_min: number;
  min_rating: number;
  max_rating: number;
  num_problems: number;
  join_token: string;
}

export interface BattleParticipant {
  id: number;
  battle_id: number;
  user_id: number;
  created_at: Date;
}

export interface BattleProblem {
  id: number;
  battle_id: number;
  contest_id: number;
  index: string;
  rating: number;
  created_at: Date;
}

export interface Submission {
  id: number;
  cf_id: string;
  battle_id: number;
  user_id: number;
  contest_id: number;
  index: string;
  verdict: string;
  passed_tests: number;
  time: Date;
}
