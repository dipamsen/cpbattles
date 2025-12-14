import { useQuery } from "@tanstack/react-query";
import { BASE_API_URL, authFetch } from "../hooks/useAuth";
import type { Battle, User, BattleProblem, Submission } from "../types";
import { differenceInSeconds } from "date-fns";

export default function FinishedBattle({
  battle,
}: {
  battle: Battle;
}) {
  const startTime = new Date(battle.start_time);
  const fmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const { data: standings, status } = useQuery<
    {
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
    }[]
  >({
    queryKey: ["battle", battle.id, "standings"],
    queryFn: async () => {
      const response = await authFetch(
        `${BASE_API_URL}/api/battle/${battle.id}/standings`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch battle standings");
      }
      return response.json();
    },
  });

  const { data: problems, status: problemsStatus } = useQuery<BattleProblem[]>({
    queryKey: ["battles", battle.id, "problems"],
    queryFn: async () => {
      const response = await authFetch(
        `${BASE_API_URL}/api/battle/${battle.id}/problems`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch battle problems");
      }
      return response.json();
    },
  });

  const { data: submissions, status: submissionStatus } = useQuery<
    Submission[]
  >({
    queryKey: ["battles", battle.id, "submissions"],
    queryFn: async () => {
      const response = await authFetch(
        `${BASE_API_URL}/api/battle/${battle.id}/submissions`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch battle submissions");
      }
      return response.json();
    },
  });

  const handleOf = (id: number) => {
    if (status === "success") {
      const user = standings?.find((s) => s.user.id === id);
      return user ? user.user.handle : "Unknown User";
    }
    return "Loading...";
  };

  const relativeTimeDiff = (final: Date, initial: Date) => {
    const diff = differenceInSeconds(final, initial);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return [hours, minutes, seconds]
      .map((x) => x.toString().padStart(2, "0"))
      .join(":");
  };

  const problemsWithMappedNames = (problems || []).map((problem, i) => ({
    contestId: problem.contest_id,
    index: problem.index,
    name: `P${i + 1}`,
  }));

  const getMappedProblemName = (contestId: number, index: string) => {
    return (
      problemsWithMappedNames.find((p) => {
        return p.contestId === contestId && p.index === index;
      })?.name || `P${contestId}${index}`
    );
  };

  return (
    <div className="flex flex-col h-full flex-1 max-w-7xl w-[90%] mx-auto py-2 gap-4">
      <h1 className="text-2xl font-bold mb-4">Finished Battle</h1>
      <div className="grid lg:grid-cols-3 w-full lg:gap-4 gap-1 grid-cols-1">
        <div className="flex-1 border border-gray-300 p-2 rounded-lg text-center bg-green-100">
          Battle Name: <strong>{battle.title}</strong>
        </div>
        <div className="flex-1 border border-gray-300 p-2 rounded-lg text-center bg-green-100">
          Rating: {battle.min_rating} - {battle.max_rating}
        </div>
        <div className="flex-1 border border-gray-300 p-2 rounded-lg text-center bg-green-100">
          Problems: {battle.num_problems}
        </div>
      </div>
      <div className="grid lg:grid-cols-2 w-full lg:gap-4 gap-1 grid-cols-1">
        <div className="flex-1 border border-gray-300 p-2 rounded-lg text-center bg-green-100">
          Start Time: {fmt.format(startTime)}
        </div>
        <div className="flex-1 border border-gray-300 p-2 rounded-lg text-center bg-green-100">
          Duration: {battle.duration_min} minutes
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Standings</h2>
      {status === "pending" || problemsStatus === "pending" ? (
        <p>Loading standings...</p>
      ) : status === "error" || problemsStatus === "error" ? (
        <p className="text-red-500">Failed to load standings</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handle
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  =
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Penalty
                </th>
                {problems.map((problem, i) => (
                  <th
                    key={problem.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    P{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y  divide-gray-200">
              {standings.map((standings, index) => (
                <tr key={standings.user.id}>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap font-bold">
                    {standings.user.handle}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    {standings.solved}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    {standings.solved > 0 ? standings.penalty : ""}
                  </td>
                  {Object.values(standings.problemData).map((data, i) => (
                    <td
                      key={i}
                      className="px-6 py-3 whitespace-nowrap text-center font-bold"
                    >
                      {data.solved ? (
                        <span className="text-green-500 text-lg">
                          +
                          {data.wrongSubmissions > 0
                            ? data.wrongSubmissions
                            : ""}
                        </span>
                      ) : (
                        <span className="text-gray-700">
                          {data.wrongSubmissions > 0
                            ? `-${data.wrongSubmissions}`
                            : ""}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* problems */}
      <h2 className="text-xl font-semibold mb-2 mt-4">Problems</h2>
      {problemsStatus === "pending" ? (
        <p>Loading problems...</p>
      ) : problemsStatus === "error" ? (
        <p className="text-red-500">Failed to load problems</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {problems.map((problem, i) => (
            <a
              key={problem.id}
              href={`https://codeforces.com/problemset/problem/${problem.contest_id}/${problem.index}`}
              target="_blank"
            >
              <div className="border border-gray-300 p-2 rounded-lg bg-white font-bold hover:bg-gray-100 transition-colors">
                P{i + 1}: {problem.contest_id}
                {problem.index}
              </div>
            </a>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2 mt-4">Submissions</h2>
      {submissionStatus === "pending" ? (
        <p>Loading submissions...</p>
      ) : submissionStatus === "error" ? (
        <p className="text-red-500">Failed to load submissions</p>
      ) : (
        <div className="overflow-x-auto border border-gray-300 p-4 rounded-lg bg-white font-monospace">
          {submissions.length > 0
            ? submissions.map((submission) => (
                <p key={submission.id}>
                  <a
                    href={`https://codeforces.com/contest/${submission.contest_id}/submission/${submission.cf_id}`}
                    target="_blank"
                    className="text-blue-500 hover:underline"
                  >
                    {submission.cf_id}
                  </a>{" "}
                  [{relativeTimeDiff(new Date(submission.time), startTime)}]{" "}
                  <span className="font-semibold">
                    {handleOf(submission.user_id)}
                  </span>{" "}
                  submitted{" "}
                  {getMappedProblemName(
                    submission.contest_id,
                    submission.index
                  )}{" "}
                  with{" "}
                  <span
                    className={
                      submission.verdict === "OK"
                        ? "text-green-500 font-bold"
                        : "text-red-500"
                    }
                  >
                    {submission.verdict == "OK"
                      ? "Accepted"
                      : submission.verdict}
                  </span>{" "}
                  {submission.verdict != "OK" && (
                    <>on Test {submission.passed_tests + 1}</>
                  )}
                </p>
              ))
            : "No submissions yet."}
        </div>
      )}
    </div>
  );
}
