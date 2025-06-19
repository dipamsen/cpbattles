import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";
import FinishedBattle from "./FinishedBattle";
import OngoingBattle from "./OngoingBattle";
import UpcomingBattle from "./UpcomingBattle";

export default function BattlePage() {
  const { battleId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();

  const {
    data: battle,
    status,
    error,
  } = useQuery({
    queryKey: ["battle", battleId],
    queryFn: async () => {
      if (!auth.authed) throw new Error("Unauthorized");
      const response = await fetch(`${BASE_API_URL}/api/battle/${battleId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.jwt}`,
        },
      });
      if (!response.ok) {
        throw new Error("Battle not found");
      }
      return response.json();
    },
  });

  if (auth.loading) {
    return <div className="text-center w-full">Loading...</div>;
  }

  if (!auth.authed) {
    navigate("/");
    return null;
  }

  if (status === "pending") {
    return <div className="text-center w-full">Loading...</div>;
  }

  if (status === "error") {
    return (
      <div className="text-center w-full text-red-500">{error.message}</div>
    );
  }

  if (!battle) {
    return (
      <div className="text-center w-full text-red-500">Battle not found</div>
    );
  }

  if (battle.status === "pending") {
    return <UpcomingBattle battle={battle} auth={auth} />;
  } else if (battle.status === "in_progress") {
    return <OngoingBattle battle={battle} auth={auth} />;
  } else if (battle.status === "completed") {
    return <FinishedBattle battle={battle} auth={auth} />;
  } else {
    return (
      <div className="text-center w-full text-red-500">
        Unknown battle status
      </div>
    );
  }
}
