import Agenda, { Job } from "agenda";
import { db, pool } from "../config/database";
import { Battle, queries, Submission, User } from "../utils/postgres";
import { cf, Codeforces } from "../utils/codeforces";
import { addMinutes } from "date-fns";

const mongoConnectionString =
  process.env.MONGO_CONNECTION_STRING || "mongodb://localhost:27017/agenda";

export const agenda = new Agenda({
  db: {
    address: mongoConnectionString,
  },
  processEvery: "30 seconds",
});

let agendaAvailable = false;

agenda.on("error", (error) => {
    console.error("Agenda error:", error);
  agendaAvailable = false;
});

agenda.on("ready", async () => {
  console.log("Agenda is ready");
  agendaAvailable = true;
  try {
    await agenda.start();
  } catch (error) {
    console.warn("Failed to start Agenda:", error instanceof Error ? error.message : String(error));
    agendaAvailable = false;
  }
});

agenda.on("fail", (error) => {
  console.error("Agenda failed:", error);
  agendaAvailable = false;
});

export function isAgendaAvailable(): boolean {
  return agendaAvailable;
}

agenda.define("battle:start", async (job: Job<{ battleId: number }>) => {
  const { battleId } = job.attrs.data;
  console.log(`Starting battle ${battleId}`);

  const battle = await db.getBattleById(battleId);
  if (!battle) {
    console.error(`Battle ${battleId} not found`);
    return;
  }

  const client = await pool.connect();

  try {
    client.query("BEGIN");

    const participants = await db.getBattleParticipants(battleId);

    const problems = await cf.chooseProblems(
      battle.min_rating,
      battle.max_rating,
      battle.num_problems,
      participants.map(participant => participant.handle)
    );

    for (const problem of problems) {
      await db.query(
        queries.INSERT_PROBLEM_TO_BATTLE,
        [battleId, problem.contestId, problem.index, problem.rating],
        client
      );
    }

    await db.query(queries.START_BATTLE, [battleId], client);
    console.log(`Battle ${battleId} started successfully`);

    await agenda.create("battle:poll-submissions", {
      battle: battle,
      problems: problems,
      participants: participants,
      battleId: battleId,
    }).repeatEvery("1 minute").save();

    await agenda.schedule(
      new Date(
        new Date(battle.start_time).getTime() + battle.duration_min * 60 * 1000
      ),
      "battle:end",
      { battleId: battleId }
    );

    await client.query("COMMIT");
    console.log(`Scheduled polling for battle ${battleId}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Failed to start battle ${battleId}:`, error);
  } finally {
    client.release();
  }
});

agenda.define(
  "battle:poll-submissions",
  async (
    job: Job<{
      battle: Battle;
      problems: Codeforces.Problem[];
      participants: User[];
      battleId: number;
    }>
  ) => {
    const { battle, problems, participants } = job.attrs.data;
    await pollSubmissions(battle, problems, participants);
  }
);

export async function pollSubmissions(
  battle: Battle,
  problems: {
    contestId?: number;
    index: string;
  }[],
  participants: User[]
) {
  const endTime = addMinutes(new Date(battle.start_time), battle.duration_min);

  console.log(`Polling submissions for battle ${battle.id}`);

  const storedSubmissions = await db.getBattleSubmissions(battle.id);
  const storedSubmissionIds = new Set(
    storedSubmissions.map((sub) => sub.cf_id)
  );

  for (const participant of participants) {
    const allSubmissions = await cf.getSubmissions(participant.handle);

    const newSubmissions = allSubmissions.filter(
      (sub) =>
        problems.some(
          (problem) =>
            problem.contestId === sub.problem.contestId &&
            problem.index === sub.problem.index
        ) &&
        sub.creationTimeSeconds >=
          new Date(battle.start_time).getTime() / 1000 &&
        sub.creationTimeSeconds <= endTime.getTime() / 1000 &&
        !storedSubmissionIds.has(sub.id.toString()) &&
        sub.verdict != "TESTING"
    );

    if (newSubmissions.length === 0) {
      continue;
    }

    const submissionsToInsert = newSubmissions.map((sub) => [
      sub.id.toString(),
      battle.id,
      participant.id,
      sub.problem.contestId,
      sub.problem.index,
      sub.verdict,
      sub.passedTestCount,
      new Date(sub.creationTimeSeconds * 1000),
    ]);

    if (submissionsToInsert.length > 0) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const submission of submissionsToInsert) {
          await db.query(queries.INSERT_SUBMISSION, submission, client);
        }
        await client.query("COMMIT");
        console.log(
          `Inserted ${submissionsToInsert.length} new submissions for user ${participant.handle}`
        );
      } catch (error) {
        console.error(
          `Failed to insert submissions for user ${participant.handle}:`,
          error
        );
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    }
  }
}

agenda.define("battle:end", async (job: Job<{ battleId: number }>) => {
  const { battleId } = job.attrs.data;
  console.log(`Ending battle ${battleId}`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const battle = await db.getBattleById(battleId);
    if (!battle) {
      console.error(`Battle ${battleId} not found`);
      return;
    }
    await db.query(queries.END_BATTLE, [battleId], client);
    console.log(`Battle ${battleId} ended successfully`);
    await client.query("COMMIT");

    if (isAgendaAvailable()) {
      try {
        await agenda.cancel({ "data.battleId": battleId });
      } catch (error) {
        console.warn(`Failed to cancel polling jobs for battle ${battleId}:`, error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    console.error(`Failed to end battle ${battleId}:`, error);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
});
