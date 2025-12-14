import { useQuery, useQueryClient } from "@tanstack/react-query";

export const BASE_API_URL = import.meta.env.VITE_APP_BACKEND_URL; //"";

export function getToken() {
  return localStorage.getItem("token");
}

export async function authFetch(input: RequestInfo, init?: RequestInit) {
  const token = getToken();
  const headers = new Headers(init?.headers as any || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

type AuthResponse =
  | { authed: false; loading: false; error: string }
  | {
      authed: true;
      loading: false;
      handle: string;
      logout: () => void;
    }
  | { authed: false; loading: true }
  | { authed: false; loading: false };

export function useAuth(): AuthResponse {
  const queryClient = useQueryClient();

  const { status, data } = useQuery<
    | {
        authed: true;
        handle: string;
      }
    | { authed: false }
  >({
    queryKey: ["auth"],
    queryFn: async () => {
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
      async logout() {
        await authFetch(BASE_API_URL + "/auth/logout", {
          method: "POST",
        });
        localStorage.removeItem("token");
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
