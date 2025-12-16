import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { db, pool } from "../config/database";
import { queries, User } from "../utils/postgres";
import { agenda, pollSubmissions, isAgendaAvailable } from "../config/agenda";
import nanoid from "nanoid";

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

      if (isAgendaAvailable()) {
        try {
          await agenda.schedule(startTime, "battle:start", { battleId: battleId[0].id });
        } catch (error) {
          console.warn(`Failed to schedule battle start for battle ${battleId[0].id}:`, error instanceof Error ? error.message : String(error));
        }
      } else {
        console.warn(`Agenda not available - battle ${battleId[0].id} will not auto-start. Use manual start when ready.`);
      }
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
        return b.solved - a.solved;
      }
      return a.penalty - b.penalty;
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
      return a.time.getTime() - b.time.getTime();
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

  async cancelBattle(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    if (battle.created_by !== userId) {
      throw new Error("Only the battle creator can cancel the battle");
    }

    if (battle.status === "completed") {
      throw new Error("Cannot cancel a completed battle");
    }

    if (isAgendaAvailable()) {
      try {
        await agenda.cancel({ "data.battleId": battleId });
      } catch (error) {
        console.warn(`Failed to cancel agenda jobs for battle ${battleId}:`, error instanceof Error ? error.message : String(error));
      }
    }

    await db.query(queries.DELETE_BATTLE, [battleId]);
  },

  async startBattle(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    if (battle.created_by !== userId) {
      throw new Error("Only the battle creator can start the battle");
    }

    if (battle.status !== "pending") {
      throw new Error(`Battle is already ${battle.status}`);
    }

    if (isAgendaAvailable()) {
      throw new Error("Agenda is already running for this battle");
    }

    const { cf } = await import("../utils/codeforces");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const participants = await db.getBattleParticipants(battleId);

      const problems = await cf.chooseProblems(
        battle.min_rating,
        battle.max_rating,
        battle.num_problems,
        participants.map((participant) => participant.handle)
      );

      for (const problem of problems) {
        await db.query(
          queries.INSERT_PROBLEM_TO_BATTLE,
          [battleId, problem.contestId, problem.index, problem.rating],
          client
        );
      }

      await db.query(queries.START_BATTLE, [battleId], client);
      console.log(`Battle ${battleId} started successfully (manual)`);

      if (isAgendaAvailable()) {
        try {
          await agenda.create("battle:poll-submissions", {
            battle: battle,
            problems: problems,
            participants: participants,
            battleId: battleId,
          }).repeatEvery("1 minute").save();

          const endTime = new Date(
            new Date(battle.start_time).getTime() + battle.duration_min * 60 * 1000
          );
          await agenda.schedule(endTime, "battle:end", { battleId: battleId });
        } catch (error) {
          console.warn(`Failed to schedule agenda jobs for battle ${battleId}:`, error instanceof Error ? error.message : String(error));
        }
      } else {
        console.warn(`Agenda not available - polling for battle ${battleId} must be done manually via refresh endpoint`);
      }

      await client.query("COMMIT");
      return { message: "Battle started successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async endBattle(battleId: number, userId: number) {
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    if (battle.created_by !== userId) {
      throw new Error("Only the battle creator can end the battle");
    }

    if (battle.status !== "in_progress") {
      throw new Error(`Battle is already ${battle.status}`);
    }

    // TODO FIX: Race condition with agenda job

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await db.query(queries.END_BATTLE, [battleId], client);
      console.log(`Battle ${battleId} ended successfully`);

      await client.query("COMMIT");
      return { message: "Battle ended successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
