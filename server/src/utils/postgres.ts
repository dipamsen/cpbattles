import { Pool, QueryResultRow, PoolClient } from "pg";

export const queries = {
  UPSERT_USER: `INSERT INTO users (sub, handle, avatar, rating, last_login)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (sub) 
      DO UPDATE SET handle = $2, avatar = $3, rating = $4, last_login = NOW()
      RETURNING *`,
  CREATE_BATTLE:
    "INSERT INTO battles (created_by, title, start_time, duration_min, min_rating, max_rating, num_problems, join_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
  JOIN_BATTLE:
    "INSERT INTO battle_participants (battle_id, user_id) VALUES ($1, $2) RETURNING id",
  START_BATTLE:
    "UPDATE battles SET status = 'in_progress' WHERE id = $1 RETURNING *",
  END_BATTLE:
    "UPDATE battles SET status = 'completed' WHERE id = $1 RETURNING *",
  DELETE_BATTLE:
    "DELETE FROM battles WHERE id = $1 RETURNING *",
  INSERT_PROBLEM_TO_BATTLE:
    "INSERT INTO battle_problems (battle_id, contest_id, index, rating) VALUES ($1, $2, $3, $4) RETURNING id",
  INSERT_SUBMISSION:
    "INSERT INTO submissions (cf_id, battle_id, user_id, contest_id, index, verdict, passed_tests, time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
} as const;

export type Query = (typeof queries)[keyof typeof queries];

interface QueryResult {
  INSERT_USER: {
    id: number;
  }[];
  UPSERT_USER: User[];
}

export class DatabaseClient {
  constructor(private readonly pool: Pool) {}

  query(
    query: typeof queries.UPSERT_USER,
    params: [string, string, string | null, number | null],
    client: PoolClient
  ): Promise<QueryResult["UPSERT_USER"]>;

  async query<T extends QueryResultRow>(
    text: string,
    params?: any[],
    client?: PoolClient
  ): Promise<T[]>;
  async query<T extends QueryResultRow>(
    text: string,
    params?: any[],
    client?: PoolClient
  ): Promise<T[]> {
    if (client) {
      const result = await client.query<T>(text, params);
      return result.rows;
    } else {
      const client = await this.pool.connect();
      try {
        const result = await client.query<T>(text, params);
        return result.rows;
      } catch (error) {
        throw error;
      } finally {
        client.release();
      }
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getUserBySub(sub: string) {
    const result = await this.query("SELECT * FROM users WHERE sub = $1", [
      sub,
    ]);
    return result.length > 0 ? result[0] : null;
  }

  async getBattleById(battleId: number) {
    const result = await this.query<Battle>(
      "SELECT * FROM battles WHERE id = $1",
      [battleId]
    );
    return result.length > 0 ? result[0] : null;
  }

  async getBattleByJoinToken(joinToken: string) {
    const result = await this.query<Battle>(
      "SELECT * FROM battles WHERE join_token = $1",
      [joinToken]
    );
    return result.length > 0 ? result[0] : null;
  }

  async getBattleParticipants(battleId: number) {
    const result = await this.query<User>(
      "SELECT u.* FROM battle_participants AS bp JOIN users AS u ON bp.user_id = u.id WHERE bp.battle_id = $1;",
      [battleId]
    );
    return result;
  }

  async getBattleProblems(battleId: number) {
    const result = await this.query<BattleProblem>(
      "SELECT * FROM battle_problems WHERE battle_id = $1",
      [battleId]
    );
    return result;
  }

  async getBattlesByParticipantId(userId: number) {
    const result = await this.query<Battle>(
      "SELECT b.* FROM battles b JOIN battle_participants bp ON b.id = bp.battle_id WHERE bp.user_id = $1;",
      [userId]
    );
    return result;
  }

  async getBattleSubmissions(battleId: number) {
    const result = await this.query<Submission>(
      "SELECT * FROM submissions WHERE battle_id = $1",
      [battleId]
    );
    return result;
  }
}

export interface User {
  id: number;
  sub: string;
  handle: string;
  avatar: string;
  rating: number;
  created_at: Date;
  last_login: Date | null;
}

export interface Verification {
  id: number;
  user_id: number;
  created_at: Date;
  contest_id: number;
  index: string;
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
