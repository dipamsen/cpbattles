import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { BASE_API_URL, useAuth } from "../hooks/useAuth";

export default function JoinBattle() {
  const { joinCode } = useParams<{ joinCode: string }>();
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationKey: ["joinBattle", joinCode],
    mutationFn: async () => {
      if (!auth.authed) {
        throw new Error("You must be logged in to join a battle");
      }
      if (!joinCode) {
        throw new Error("Join code is required");
      }
      const response = await auth.fetch(BASE_API_URL + `/api/battle/join/${joinCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const out = await response.json();
      if (!response.ok) {
        throw new Error(
          `Failed to join battle: ${out.error || "Unknown error"}`
        );
      }
      queryClient.invalidateQueries({ queryKey: ["battles"] });
      return out;
    },
  });

  useEffect(() => {
    if (auth.loading) {
      return;
    }
    if (!auth.authed) {
      navigate("/");
      return;
    }
    mut.mutate();
  }, [auth.authed, auth.loading]);

  if (mut.status === "pending") {
    return (
      <div className="w-full text-gray-500 text-center" role="status">
        Joining battle...
      </div>
    );
  }

  if (mut.status === "error") {
    return (
      <div className="w-full text-red-500 text-center" role="alert">
        {mut.error instanceof Error
          ? mut.error.message
          : "Something went wrong."}
      </div>
    );
  }

  if (mut.status === "success") {
    navigate(`/`);
    return null;
  }
}
