/**
 * Verify CF Handle Flow:
 * - User enters their Codeforces handle
 * - Handle is sent to backend (/verify-user)
 * - Backend responds with a problem (if no error)
 * - User must create a submission with WA verdict within 5 minutes to the given problem
 * - User must press Verify.
 * - /check-submission endpoint checks if the user has a WA submission to the problem
 * - If yes, user is verified and JWT is returned
 * - JWT is stored in localStorage
 * - User is redirected to the home page
 */

import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import { useNavigate } from "react-router";
import { BASE_API_URL, LS_KEY, useAuth } from "../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import TextInput from "../components/TextInput";

type State =
  | {
      status: "idle";
    }
  | {
      status: "loading-1";
    }
  | {
      status: "awaiting-submission";
      contestId: string;
      index: string;
    }
  | {
      status: "loading-2";
    }
  | {
      status: "success";
    }
  | {
      status: "error";
      message: string;
    };

export default function VerifyCF() {
  const [state, setState] = useState<State>({ status: "idle" });
  const handleVal = useRef<string>(null);
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const handle = (
      e.currentTarget.elements[0] as HTMLInputElement
    ).value.trim();
    handleVal.current = handle;

    if (!handle) {
      setState({ status: "error", message: "Handle cannot be empty" });
      return;
    }

    setState({ status: "loading-1" });

    try {
      const response = await fetch(BASE_API_URL + "/api/verify-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify user");
      }

      const data = await response.json();
      setState({
        status: "awaiting-submission",
        contestId: data.contestId,
        index: data.index,
      });
    } catch (error) {
      setState({ status: "error", message: (error as any).message });
    }
  };

  const handleVerifySubmission = async () => {
    setState({ status: "loading-2" });

    try {
      const response = await fetch(BASE_API_URL + "/api/check-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handleVal.current,
        }),
      });

      const data = await response.json();
      if (data.verified) {
        localStorage.setItem(LS_KEY, data.jwt);
        queryClient.invalidateQueries({ queryKey: ["auth"] });
        setState({ status: "success" });
        navigate("/");
      } else {
        setState({
          status: "error",
          message: data.error || "Submission not found",
        });
      }
    } catch (error) {
      setState({ status: "error", message: (error as any).message });
    }
  };

  useEffect(() => {
    if (auth.loading) return;

    if (auth.authed) {
      navigate("/");
    }
  }, [auth.loading, auth.authed, navigate]);

  return (
    <div className="mx-auto">
      {auth.loading && (
        <div className="flex flex-col items-center h-full flex-1 max-w-7xl w-[90%] mx-auto py-8 gap-4">
          <div className="text-xl">Loading...</div>
        </div>
      )}

      {!auth.loading && (
        <div className="flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-800 mb-4">
            Verify Codeforces Handle
          </div>
          <div className="text-lg text-gray-600 mb-8">
            Please enter your Codeforces handle to verify your account.
          </div>
          <form
            className="flex flex-col items-center w-full max-w-md"
            onSubmit={handleSubmit}
          >
            <TextInput
              type="text"
              className="mb-4 w-full"
              placeholder="Codeforces Handle"
              disabled={state.status !== "idle"}
            />
            <Button disabled={state.status !== "idle"} type="submit">
              Submit
            </Button>
          </form>

          {state.status === "loading-1" && (
            <div className="mt-4 text-gray-600">Verifying handle...</div>
          )}

          {state.status === "awaiting-submission" && (
            <>
              <div className="my-4 text-gray-600 w-3/4 text-center">
                <strong>Verification: </strong>
                Please create a submission to the problem{" "}
                <a
                  href={`https://codeforces.com/contest/${state.contestId}/problem/${state.index}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {state.contestId}
                  {state.index}
                </a>{" "}
                with a Compilation Error (<code>COMPILATION_ERROR</code>)
                verdict within 5 minutes.
              </div>
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
                onClick={handleVerifySubmission}
              >
                Verify
              </button>
            </>
          )}

          {state.status === "loading-2" && (
            <div className="mt-4 text-gray-600">Checking submission...</div>
          )}

          {state.status === "success" && (
            <div className="mt-4 text-green-600">
              Verification successful! You are now logged in.
            </div>
          )}

          {state.status === "error" && (
            <div className="mt-4 text-red-600">Error: {state.message}</div>
          )}
        </div>
      )}
    </div>
  );
}
