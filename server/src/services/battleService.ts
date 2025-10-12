import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { db, pool } from "../config/database";
import { queries, User } from "../utils/postgres";
import { agenda, pollSubmissions } from "../config/agenda";
import nanoid from "nanoid";
import { joinBattle } from "../controllers/battleController";

export const battleService = {
  async createBattle(user: User, details: any) {
    const startTime = new Date(details.startTime);

    const client = await pool.connect();

    try {
      client.query("BEGIN");

      const battleId = await db.query(
        queries.CREATE_BATTLE,
        [
          user.id,
          details.name,
          startTime,
          details.duration,
          details.minRating,
          details.maxRating,
          details.problemCount,
          nanoid.nanoid(),
        ],
        client
      );

      await db.query(queries.JOIN_BATTLE, [battleId[0].id, user.id], client);

      agenda.schedule(startTime, "battle:start", { battleId: battleId[0].id });
      client.query("COMMIT");
      return battleId[0].id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(
        "message" in (error as any) ? (error as any).message : "Unknown error"
      );
    }
  },

  async joinBattle(joinToken: string, userId: number) {
    const battle = await db.getBattleByJoinToken(joinToken);
    if (!battle) {
      throw new Error("Battle not found or join token is invalid");
    }
    if (battle.status !== "pending") {
      throw new Error("You can only join battles that have not started yet");
    }
    const participants = await db.getBattleParticipants(battle.id);
    if (participants.some((p) => p.id === userId)) {
      return battle.id;
    }
    await db.query(queries.JOIN_BATTLE, [battle.id, userId]);
    return battle.id;
  },

  async getUserBattles(userId: number) {
    const battles = await db.getBattlesByParticipantId(userId);
    if (!battles || battles.length === 0) {
      return [];
    }

    return battles;
  },

  async getBattle(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    const participants = await db.getBattleParticipants(battleId);
    if (
      battle.created_by !== userId &&
      participants.every((p) => p.id !== userId)
    ) {
      throw new Error("You are not allowed to view this battle");
    }

    return battle;
  },

  async getBattleParticipants(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    const participants = await db.getBattleParticipants(battleId);
    if (
      battle.created_by !== userId &&
      participants.every((p) => p.id !== userId)
    ) {
      throw new Error("You are not allowed to view this battle");
    }

    return participants;
  },

  async getBattleProblems(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    if (battle.status === "pending") {
      throw new Error("Problems are only available after the battle starts");
    }

    const participants = await db.getBattleParticipants(battleId);
    if (
      battle.created_by !== userId &&
      participants.every((p) => p.id !== userId)
    ) {
      throw new Error("You are not allowed to view this battle");
    }

    const problems = await db.getBattleProblems(battleId);
    return problems;
  },

  async getBattleStandings(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    const participants = await db.getBattleParticipants(battleId);
    if (
      battle.created_by !== userId &&
      participants.every((p) => p.id !== userId)
    ) {
      throw new Error("You are not allowed to view this battle");
    }

    if (battle.status === "pending") {
      throw new Error("Standings are only available after the battle starts");
    }

    const startTime = battle.start_time;

    const players = await db.getBattleParticipants(battleId);

    const submissions = await db.getBattleSubmissions(battleId);

    const problems = await db.getBattleProblems(battleId);

    const standings: {
      user: User;
      solved: number;
      penalty: number;
      problemData: Record<
        number,
        {
          wrongSubmissions: number;
          correctSubmissionIntervalSeconds: number;
          solved: boolean;
        }
      >;
    }[] = [];

    for (const player of players) {
      const userSubmissions = submissions.filter(
        (s) => s.user_id === player.id
      );

      let solved = 0;
      let penalty = 0;

      const problemData: Record<
        number,
        {
          wrongSubmissions: number;
          correctSubmissionIntervalSeconds: number;
          solved: boolean;
        }
      > = {};

      for (const problem of problems) {
        const problemSubmissions = userSubmissions.filter(
          (s) =>
            s.contest_id === problem.contest_id && s.index === problem.index
        );

        const correctSubmission = problemSubmissions
          .toSorted((a, b) => a.time.getTime() - b.time.getTime())
          .find((s) => s.verdict === "OK");

        if (correctSubmission) {
          const wrongSubmissions = problemSubmissions.filter(
            (s) =>
              s.verdict !== "OK" &&
              s.time < correctSubmission.time &&
              s.passed_tests > 0
          );
          solved++;
          penalty += differenceInMinutes(correctSubmission.time, startTime);
          penalty += wrongSubmissions.length * 10;

          problemData[problem.id] = {
            wrongSubmissions: wrongSubmissions.length,
            correctSubmissionIntervalSeconds: differenceInSeconds(
              correctSubmission.time,
              startTime
            ),
            solved: true,
          };
        } else {
          const wrongSubmissions = problemSubmissions.filter(
            (s) => s.verdict !== "ACCEPTED" && s.passed_tests > 0
          );

          problemData[problem.id] = {
            wrongSubmissions: wrongSubmissions.length,
            correctSubmissionIntervalSeconds: 0,
            solved: false,
          };
        }
      }

      standings.push({
        user: player,
        solved,
        penalty,
        problemData,
      });
    }

    return standings.toSorted((a, b) => {
      if (a.solved !== b.solved) {
        return b.solved - a.solved; // Sort by number of problems solved (descending)
      }
      return a.penalty - b.penalty; // Sort by penalty (ascending)
    });
  },

  async getBattleSubmissions(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    const participants = await db.getBattleParticipants(battleId);
    if (
      battle.created_by !== userId &&
      participants.every((p) => p.id !== userId)
    ) {
      throw new Error("You are not allowed to view this battle");
    }

    const submissions = await db.getBattleSubmissions(battleId);
    return submissions.toSorted((a, b) => {
      return a.time.getTime() - b.time.getTime(); // Sort by submission time (ascending)
    });
  },

  async refreshSubmissions(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    const participants = await db.getBattleParticipants(battleId);
    if (
      battle.created_by !== userId &&
      participants.every((p) => p.id !== userId)
    ) {
      throw new Error(
        "You are not allowed to refresh submissions for this battle"
      );
    }

    if (battle.status !== "in_progress") {
      throw new Error(
        "Submissions can only be refreshed during an active battle"
      );
    }

    const problems = await db.getBattleProblems(battleId);

    pollSubmissions(battle, problems, participants);
  },
};
