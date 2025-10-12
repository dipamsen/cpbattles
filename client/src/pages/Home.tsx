import { Link } from "react-router";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";

import type { Battle } from "../types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const auth = useAuth();

  return (
    <>
      {auth.loading && (
        <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
          <div className="text-xl">Loading...</div>
        </div>
      )}

      {auth.authed && <AuthedHome user={auth} />}

      {!auth.loading && !auth.authed && (
        <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
          <div className="text-xl">
            Clash with friends in competitive programming battles!
          </div>

          <div className="text-gray-600">
            Get started by connecting your Codeforces account.
          </div>
          <div className="mt-4">
            <a
              href={BASE_API_URL + "/auth/login"}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Login with Codeforces
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function AuthedHome({ user }: { user: { handle: string } }) {
  const { status, data: battles } = useQuery<Battle[]>({
    queryKey: ["battles"],
    queryFn: async () => {
      const response = await fetch(BASE_API_URL + "/api/battles", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch battles");
      }

      const data = await response.json();
      return data;
    },
  });

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
        <div className="text-xl">Loading battles...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
        <div className="text-xl text-red-500">Failed to load battles</div>
      </div>
    );
  }

  const ongoingBattles = battles.filter(
    (battle) => battle.status == "in_progress"
  );
  const upcomingBattles = battles.filter(
    (battle) => battle.status == "pending"
  );
  // const completedBattles = battles.filter(
  //   (battle) => battle.status == "completed"
  // );

  return (
    <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
      {ongoingBattles.length === 0 && upcomingBattles.length === 0 && (
        <>
          <div className="text-xl">Welcome back, {user.handle}!</div>
          <div className="text-gray-600">Ready to challenge your friends?</div>
          <div className="mt-4">
            <Link
              to="/create"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Create a Battle
            </Link>
          </div>
        </>
      )}
      {ongoingBattles.length > 0 && (
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Ongoing Battles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ongoingBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                user={user}
                status="in_progress"
              />
            ))}
          </div>
        </div>
      )}
      {upcomingBattles.length > 0 && (
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Upcoming Battles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                user={user}
                status="pending"
              />
            ))}
          </div>
        </div>
      )}
      {/* {completedBattles.length > 0 && (
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Past Battles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedBattles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                user={user}
                status="completed"
              />
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}

function BattleCard({
  battle,
}: // status: battleStatus,
{
  battle: Battle;
  user: {
    handle: string;
  };
  status: "in_progress" | "pending" | "completed";
}) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const { status, data: participants } = useQuery<
    { id: number; handle: string }[]
  >({
    queryKey: ["battleParticipants", battle.id],
    queryFn: async () => {
      const response = await fetch(
        `${BASE_API_URL}/api/battle/${battle.id}/participants`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch participants");
      }

      return response.json();
    },
  });

  return (
    <div className="border p-4 rounded shadow bg-white hover:shadow-lg transition">
      <Link
        to={`/battle/${battle.id}`}
        className="text-xl font-bold hover:underline text-blue-600"
      >
        {battle.title}
      </Link>
      <div className="text-gray-600 mt-2">
        <div>
          <strong>Start Time:</strong> {fmt.format(new Date(battle.start_time))}
        </div>
        <div>
          <strong>Duration:</strong> {battle.duration_min} minutes
        </div>
        <div>
          <strong>Rating Range:</strong> {battle.min_rating} -{" "}
          {battle.max_rating}
        </div>
        <div>
          <strong>Problems:</strong> {battle.num_problems}
        </div>
        {status === "success" && (
          <div>
            <strong>Players:</strong>{" "}
            {participants.map((x) => x.handle).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
