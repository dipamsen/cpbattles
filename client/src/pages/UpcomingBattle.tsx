import { useQuery, useQueryClient } from "@tanstack/react-query";
import Countdown from "../components/Countdown";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";
import type { Battle, User } from "../types";
import { useEffect, useState } from "react";

export default function UpcomingBattle({
  battle,
}: {
  battle: Battle;
}) {
  const auth = useAuth();
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const startTime = new Date(battle.start_time);
  const fmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const { data: battlePlayers, status } = useQuery<User[]>({
    queryKey: ["battleParticipants", battle.id],
    queryFn: async () => {
      const response = await auth.fetch(
        `${BASE_API_URL}/api/battle/${battle.id}/participants`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch battle participants");
      }
      return response.json();
    },
  });

  return (
    <div className="flex flex-col  h-full flex-1 max-w-7xl w-[90%] mx-auto py-2 gap-4">
      <h1 className="text-2xl font-bold mb-4">Upcoming Battle</h1>
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

      {/* countdown */}
      <div className="text-center mt-4">
        <h2 className="text-xl font-semibold mb-2">Battle starts in</h2>
        <Countdown
          targetTime={startTime}
          onZero={() => {
            queryClient.invalidateQueries({ queryKey: ["battle", battle.id] });
          }}
        />
      </div>

      <div className="mt-4 flex gap-12 flex-col lg:flex-row">
        <div className="w-sm">
          <h2 className="text-xl font-semibold mb-2">Participants</h2>
          {status === "pending" ? (
            <p>Loading participants...</p>
          ) : status === "error" ? (
            <p className="text-red-500">Failed to load participants</p>
          ) : (
            <div>
              {battlePlayers.map((player) => (
                <div
                  key={player.id}
                  className="p-2 rounded mb-2 bg-white font-bold text-purple-700 shadow-md"
                >
                  {player.handle}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">Rules</h2>
          <div>
            <ul className="list-disc ml-4">
              <li>
                Problems are randomly chosen from the selected rating range from
                the Codeforces problem set.
              </li>
              <li>
                During the battle, the problem descriptions, and a link to
                submit solutions on Codeforces will be accessible.
              </li>
              <li>
                Submissions made from the verified Codeforces accounts to the
                respective problems within the battle duration will be counted.
              </li>
              <li>
                Standings will be decided similar to Div. 3 Codeforces contests:
                Number of problems solved, then time penalty for each problem.
              </li>
              <li>
                Every non-AC submission with at least one passed test case will
                incur a penalty of 10 minutes. (This holds even if the problem
                description has more than one sample test case.)
              </li>
            </ul>
          </div>
          <h2 className="text-xl font-semibold mt-4 mb-2">
            Invite your friends
          </h2>
          <p>
            Share the battle link with your friends to join the fun! The more,
            the merrier!
          </p>
          <div className="mt-2 p-2 border border-gray-300 rounded bg-gradient-to-r from-green-700 to-blue-600 flex justify-between">
            <div className="text-white font-bold truncate">
              {`${window.location.origin}/battle/join/${battle.join_token}`}
            </div>
            <button
              className="text-white text-sm border border-white rounded px-2 cursor-pointer hover:bg-white hover:text-blue-600 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/battle/join/${battle.join_token}`
                );
                setCopied(true);
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
