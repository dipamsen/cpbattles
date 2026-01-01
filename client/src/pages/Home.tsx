import { Link } from "react-router";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";
import type { Battle } from "../types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const auth = useAuth();

  return (
    <div className="flex flex-col w-full">
      {auth.loading && (
        <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-2xl font-bold text-gray-500 animate-pulse flex items-center gap-3">
            <span className="text-4xl">⚔️</span> Loading CP Battles...
          </div>
        </div>
      )}

      {auth.authed && <AuthedHome user={auth} />}

      {!auth.loading && !auth.authed && (
        <div className="flex flex-col flex-grow">
          <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4  justify-center py-4">
            <div className="text-center mt-4 max-w-3xl">
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="text-6xl">
                  <img src="/logo.svg" alt="CP Battles Logo" className="w-20" />
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  CP Battles
                </h1>
              </div>

              <p className="text-xl md:text-2xl text-gray-700 font-medium mb-8">
                The ultimate arena for competitive programmers. <br />
                Clash with friends in real-time Codeforces battles!
              </p>

              <a
                href={BASE_API_URL + "/auth/login"}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 inline-block"
              >
                Login with Codeforces
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthedHome({ user }: { user: any }) {
  const auth = useAuth();

  const { status, data: battles } = useQuery<Battle[]>({
    queryKey: ["battles"],
    queryFn: async () => {
      if (!auth.authed) return [];
      const response = await auth.fetch(BASE_API_URL + "/api/battles");
      if (!response.ok) throw new Error("Failed to fetch battles");
      return response.json();
    },
  });

  if (status === "pending") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-xl animate-pulse">Loading battles...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-500">Failed to load battles</div>
      </div>
    );
  }

  const ongoingBattles =
    battles?.filter((b) => b.status === "in_progress") || [];
  const upcomingBattles = battles?.filter((b) => b.status === "pending") || [];

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 flex-grow py-8">
        {ongoingBattles.length === 0 && upcomingBattles.length === 0 && (
          <div className="text-center mt-12">
            <div className="text-2xl font-bold mb-2">
              Welcome back, {user.handle}!
            </div>
            <div className="text-gray-600 mb-6">
              Ready to challenge your friends?
            </div>
            <Link
              to="/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition shadow-lg"
            >
              Create a Battle
            </Link>
          </div>
        )}

        {(ongoingBattles.length > 0 || upcomingBattles.length > 0) && (
          <div className="w-full">
            {ongoingBattles.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-4 mt-8">
                  Ongoing Battles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ongoingBattles.map((b) => (
                    <BattleCard key={b.id} battle={b} />
                  ))}
                </div>
              </>
            )}

            {upcomingBattles.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-4 mt-12">
                  Upcoming Battles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingBattles.map((b) => (
                    <BattleCard key={b.id} battle={b} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BattleCard({ battle }: { battle: Battle }) {
  const auth = useAuth();
  const fmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const { status, data: participants } = useQuery<
    { id: number; handle: string }[]
  >({
    queryKey: ["battleParticipants", battle.id],
    queryFn: async () => {
      if (!auth.authed) return [];
      const response = await auth.fetch(
        `${BASE_API_URL}/api/battle/${battle.id}/participants`
      );
      if (!response.ok) throw new Error("Failed to fetch participants");
      return response.json();
    },
  });

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <Link
        to={`/battle/${battle.id}`}
        className="text-xl font-bold hover:text-blue-600 text-gray-900 block mb-2"
      >
        {battle.title}
      </Link>
      <div className="text-gray-600 text-sm space-y-1">
        <div>
          <strong>Start:</strong> {fmt.format(new Date(battle.start_time))}
        </div>
        <div>
          <strong>Duration:</strong> {battle.duration_min} mins
        </div>
        <div>
          <strong>Rating:</strong> {battle.min_rating} - {battle.max_rating}
        </div>
        {status === "success" && participants && (
          <div className="truncate mt-2 text-xs text-gray-500">
            Players: {participants.map((p) => p.handle).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
