import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

export const BASE_API_URL = import.meta.env.VITE_APP_BACKEND_URL; //"";

type AuthResponse =
  | { authed: false; loading: false; error: string }
  | {
      authed: true;
      loading: false;
      handle: string;
      logout: () => void;
      fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    }
  | { authed: false; loading: true }
  | { authed: false; loading: false };

export function useAuth(): AuthResponse {
  const queryClient = useQueryClient();
  const tokenRef = useRef<string | null>(localStorage.getItem("token"));

  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const headers = new Headers(init?.headers as any || {});
    if (tokenRef.current) {
      headers.set("Authorization", `Bearer ${tokenRef.current}`);
    }
    return fetch(input, { ...init, headers });
  };

  const { status, data } = useQuery<
    | {
        authed: true;
        handle: string;
      }
    | { authed: false }
  >({
    queryKey: ["auth"],
    queryFn: async () => {
      // ensure tokenRef is in sync with localStorage (AuthCallback stores token there)
      tokenRef.current = localStorage.getItem("token");
      const response = await authFetch(BASE_API_URL + "/auth/me");

      if (!response.ok) {
        return {
          authed: false,
        };
      }

      const userData = await response.json();
      return {
        authed: true,
        handle: userData.handle,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (status === "error") {
    console.error("Failed to fetch user data:", data);
    return {
      error: "Something went wrong",
      loading: false,
      authed: false,
    };
  }
  if (status === "pending") {
    return {
      loading: true,
      authed: false,
    };
  }
  if (data.authed) {
    return {
      loading: false,
      authed: true,
      handle: data.handle,
      fetch: authFetch,
      async logout() {
        await authFetch(BASE_API_URL + "/auth/logout", {
          method: "POST",
        });
        localStorage.removeItem("token");
        tokenRef.current = null;
        queryClient.invalidateQueries({
          queryKey: ["auth"],
        });
      },
    };
  }

  return {
    loading: false,
    authed: false,
  };
}
