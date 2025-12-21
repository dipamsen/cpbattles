import { Link } from "react-router";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";
import type { Battle } from "../types";
import { useQuery } from "@tanstack/react-query";

// --- ICONS (UNCHANGED) ---
const SwordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

// --- MAIN HOME COMPONENT ---
export default function Home() {
  const auth = useAuth();

  return (
    <>
      {auth.loading && (
        <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
          <div className="text-xl animate-pulse">Loading CP Battles...</div>
        </div>
      )}

      {/* No error here anymore because we updated AuthedHome types below */}
      {auth.authed && <AuthedHome user={auth} />}

      {!auth.loading && !auth.authed && (
        <div className="flex flex-col items-center justify-center w-full px-4 py-8">
          <div className="text-center mt-8 max-w-3xl">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-6xl animate-bounce">⚔️</span>
              <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                CP Battles
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-700 font-medium mb-8">
              The ultimate arena for competitive programmers. <br />
              Clash with friends in real-time Codeforces battles!
            </p>

            <a
              href={BASE_API_URL + "/auth/codeforces"}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 inline-block"
            >
              Login with Codeforces
            </a>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-16">
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-2">
              <SwordIcon />
              <h3 className="text-xl font-bold text-gray-800 mb-2">1v1 Battles</h3>
              <p className="text-gray-600">Challenge your friends to coding duels. Pick a difficulty, set a timer, and see who solves it first.</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-2">
              <GlobeIcon />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Codeforces Sync</h3>
              <p className="text-gray-600">Seamlessly integrated with Codeforces. Problems are fetched directly from the official problemset.</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-2">
              <UsersIcon />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Live Scoreboard</h3>
              <p className="text-gray-600">Track progress in real-time. Watch as you and your opponents pass test cases live.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// FIX 2: Allowed 'handle' to be 'string | null' to match useAuth()
function AuthedHome({ user }: { user: { handle: string | null } }) {
  const auth = useAuth();

  const { status, data: battles } = useQuery<Battle[]>({
    queryKey: ["battles"],
    queryFn: async () => {
      if (!auth.authed) return [];
      const response = await auth.fetch(BASE_API_URL + "/api/battles");

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

  // FIX: Added '?' to handle cases where battles might be undefined
  const ongoingBattles = battles?.filter(
    (battle) => battle.status == "in_progress"
  ) || [];
  
  const upcomingBattles = battles?.filter(
    (battle) => battle.status == "pending"
  ) || [];

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
                user={user as { handle: string }} // Cast if needed, or update BattleCard
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
                user={user as { handle: string }}
                status="pending"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BattleCard({
  battle,
  status,
}: {
  battle: Battle;
  user: {
    handle: string;
  };
  status: "in_progress" | "pending" | "completed";
}) {
  const auth = useAuth();
  const fmt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const { status: qStatus, data: participants } = useQuery<
    { id: number; handle: string }[]
  >({
    queryKey: ["battleParticipants", battle.id],
    queryFn: async () => {
      if (!auth.authed) return [];
      const response = await auth.fetch(
        `${BASE_API_URL}/api/battle/${battle.id}/participants`
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
        {qStatus === "success" && participants && (
          <div>
            <strong>Players:</strong>{" "}
            {participants.map((x) => x.handle).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}