import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";
import {
  type Submission,
  type Battle,
  type BattleProblem,
  type User,
} from "../types";
import Countdown from "../components/Countdown";
import { addMinutes, differenceInSeconds } from "date-fns";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

export default function OngoingBattle({ battle }: { battle: Battle }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState(false);

  const auth = useAuth();
  const isCreator = auth.authed && auth.userId === battle.created_by;

  const [passedTime, setPassedTime] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  const startTime = new Date(battle.start_time);
  const endTime = addMinutes(startTime, battle.duration_min);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const passed = now >= endTime;
      setPassedTime(passed);
      if (passed && battle.status === "in_progress") {
        setTimeout(
          () =>
            queryClient.invalidateQueries({
              queryKey: ["battle", battle.id.toString()],
            }),
          500
        );
      }
      if (now.getTime() >= endTime.getTime() + 2000) {
        setShowEnd(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, battle.id, queryClient]);

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this battle? This action cannot be undone."
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      if (!auth.authed) return;
      const response = await auth.fetch(
        `${BASE_API_URL}/api/battle/${battle.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel battle");
      }

      queryClient.invalidateQueries({ queryKey: ["battles"] });
      navigate("/");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to cancel battle");
    } finally {
      setCancelling(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm("Are you sure you want to end this battle? This action cannot be undone.")) {
      return;
    }

    setEnding(true);
    try {
      if (!auth.authed) return;
      const response = await auth.fetch(
        `${BASE_API_URL}/api/battle/${battle.id}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to end battle");
      }

      queryClient.invalidateQueries({ queryKey: ["battles"] });
      navigate("/");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to end battle");
    } finally {
      setEnding(false);
    }
  };

  const { data: battleProblems, status: problemsStatus } = useQuery<
    BattleProblem[]
  >({
    queryKey: ["battles", battle.id, "problems"],
    queryFn: async () => {
      if (!auth.authed) return []
      const response = await auth.fetch(`${BASE_API_URL}/api/battle/${battle.id}/problems`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch battle problems");
      }
      return response.json();
    },
  });

  const { data: standings, status: standingsStatus } = useQuery<
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
    queryKey: ["battles", battle.id, "standings"],
    queryFn: async () => {
      if (!auth.authed) return []
      const response = await auth.fetch(`${BASE_API_URL}/api/battle/${battle.id}/standings`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch battle standings");
      }
      return response.json();
    },
  });

  const { data: submissions, status: submissionStatus } = useQuery<
    Submission[]
  >({
    queryKey: ["battles", battle.id, "submissions"],
    queryFn: async () => {
      if (!auth.authed) return []
      const response = await auth.fetch(`${BASE_API_URL}/api/battle/${battle.id}/submissions`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch battle submissions");
      }
      return response.json();
    },
  });

  const handleOf = (id: number) => {
    if (standingsStatus === "success") {
      const user = standings.find((s) => s.user.id === id);
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

  const problemsWithMappedNames = (battleProblems || []).map((problem, i) => ({
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
      <h1 className="text-2xl font-bold mb-4">Ongoing Battle</h1>
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

      <div>
        <h2 className="text-xl font-semibold mb-2">Problems</h2>
        <div className="grid grid-cols-4 gap-4">
          {problemsStatus === "pending" ? (
            <p>Loading problems...</p>
          ) : problemsStatus === "error" ? (
            <p className="text-red-500">Failed to load problems</p>
          ) : (
            battleProblems.map((problem, i) => (
              <div className="flex items-center gap-2" key={problem.id}>
                <a
                  href={`https://codeforces.com/problemset/problem/${problem.contest_id}/${problem.index}`}
                  target="_blank"
                  className="flex-1"
                >
                  <div className="border border-gray-300 p-2 rounded-lg bg-white font-bold hover:bg-gray-100 transition-colors">
                    P{i + 1}: {problem.contest_id}
                    {problem.index}
                  </div>
                </a>
                <a
                  href={`https://codeforces.com/problemset/submit/${problem.contest_id}/${problem.index}`}
                  target="_blank"
                  className="text-blue-500 hover:underline"
                >
                  Submit
                </a>
              </div>
            ))
          )}
        </div>
      </div>
      {/* standings | submissions feed | countdown */}
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">Standings</h2>
          {standingsStatus === "pending" ? (
            <p>Loading standings...</p>
          ) : standingsStatus === "error" ? (
            <p className="text-red-500">Failed to load standings</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Handle
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      =
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {standings.map((standing, index) => (
                    <tr key={standing.user.handle}>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-bold">
                        {standing.user.handle}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {standing.solved}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {standing.penalty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex-1 ">
          <div className="text-lg font-semibold text-center mb-2">
            {passedTime ? "Battle ending..." : "Battle ends in"}
          </div>
          <div className="text-center">
            <Countdown targetTime={endTime} onZero={() => {}} />
            {isCreator && showEnd && (
              <button
                onClick={handleEnd}
                disabled={ending}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {ending ? "Ending..." : "End Battle"}
              </button>
            )}
            {isCreator && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel Battle"}
              </button>
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2  mt-8">Submissions</h2>
          {submissionStatus === "pending" ? (
            <p>Loading submissions...</p>
          ) : submissionStatus === "error" ? (
            <p className="text-red-500">Failed to load submissions</p>
          ) : (
            <div className="overflow-x-auto border border-gray-300 p-4 rounded-lg bg-white font-monospace">
              {submissions.length > 0
                ? submissions.map((submission) => (
                    <p key={submission.id}>
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
      </div>
    </div>
  );
}
