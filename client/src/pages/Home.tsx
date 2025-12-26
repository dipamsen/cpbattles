import { Link } from "react-router";
// FIX 1: Bring back useAuth to show "Loading..." screen
import { BASE_API_URL, useAuth } from "../hooks/useAuth";
import Footer from "../components/Footer";

// --- ICONS ---
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

export default function Home() {
  const auth = useAuth(); // Hook to check login status

  return (
    // FIX 2: Root div has NO padding, so Footer can touch edges
    <div className="flex flex-col min-h-screen w-full">
      
      {/* Loading Screen (Visible only when checking auth) */}
      {auth.loading && (
        <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-2xl font-bold text-gray-500 animate-pulse flex items-center gap-3">
             <span className="text-4xl">⚔️</span> Loading CP Battles...
          </div>
        </div>
      )}

      {/* Main Content (Only visible when NOT loading) */}
      {!auth.loading && (
        <div className="flex flex-col flex-grow">
            
            {/* Content Wrapper - PADDING IS HERE (px-4) */}
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 flex-grow justify-center">
                
                {/* Hero Section */}
                <div className="text-center mt-16 max-w-3xl">
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

                {/* Features Grid */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
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

            {/* FIX 3: Footer is OUTSIDE padding wrapper, so it spans full width */}
            <Footer />
        </div>
      )}
    </div>
  );
}