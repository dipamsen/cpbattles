import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Home from "./pages/Home.tsx";

import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
} from "react-router";
import { useAuth } from "./hooks/useAuth.ts";
import CreateBattle from "./pages/CreateBattle.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BattlePage from "./pages/BattlePage.tsx";
import ViewProblem from "./pages/ViewProblem.tsx";
import JoinBattle from "./pages/JoinBattle.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "create",
        element: <CreateBattle />,
      },
      {
        path: "battle/:battleId",
        element: <BattlePage />,
      },
      {
        path: "battle/join/:joinCode",
        element: <JoinBattle />,
      },
    ],
  },
  {
    path: "auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "view-problem/:contestId/:index",
    element: <ViewProblem />,
  },
]);

function Layout() {
  const auth = useAuth();

  return (
    <div className="bg-gradient-to-br from-orange-100 to-emerald-100 min-h-screen flex flex-col items-start font-custom">
      <div className="flex items-center py-4 mx-auto max-w-7xl w-[90%] flex-0 flex-col md:flex-row">
        <div className="flex items-center">
          <img src="/logo.svg" alt="Logo" className="h-15 w-15 mr-2" />
          <Link to="/">
            <div className="text-3xl font-bold bg-blue-900 bg-clip-text text-transparent">
              CP Battles
            </div>
          </Link>
        </div>
        {!auth.loading && auth.authed && (
          <div className="md:ml-auto flex items-center gap-8 mt-4 md:mt-0">
            <div>
              Hi, <span className="font-bold">{auth.handle}</span>
            </div>
            <button
              className="text-blue-500 hover:underline cursor-pointer"
              onClick={auth.logout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <Outlet />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      // staleTime: 10 * 1000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
