import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export const BASE_API_URL = import.meta.env.VITE_API_URL;

interface User {
  id: string;
  handle: string;
  avatar: string;
}

interface AuthContextType {
  authed: boolean;
  loading: boolean;
  user: User | null;
  handle: string | null;
  login: () => void;
  logout: () => void;
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// FIX: Used 'React.ReactNode' which works everywhere
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(url, { ...options, headers });
    },
    []
  );

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE_API_URL}/api/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    window.location.href = `${BASE_API_URL}/auth/codeforces`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        authed: !!user,
        loading,
        user,
        handle: user?.handle || null,
        login,
        logout,
        fetch: fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}