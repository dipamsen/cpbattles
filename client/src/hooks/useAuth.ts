import { useQuery, useQueryClient } from "@tanstack/react-query";

export const LS_KEY = "cpb-jwt";
export const BASE_API_URL = import.meta.env.VITE_APP_BACKEND_URL; //"";

type AuthResponse =
  | { authed: false; loading: false; error: string }
  | {
      authed: true;
      loading: false;
      handle: string;
      jwt: string;
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
        jwt: string;
      }
    | { authed: false }
  >({
    queryKey: ["auth"],
    queryFn: async () => {
      const token = localStorage.getItem(LS_KEY);
      if (!token) {
        return {
          authed: false,
        };
      }

      const response = await fetch(BASE_API_URL + "/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return {
          authed: false,
        };
      }

      const userData = await response.json();
      return {
        authed: true,
        handle: userData.handle,
        jwt: token,
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
      jwt: data.jwt,
      logout() {
        localStorage.removeItem(LS_KEY);
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
