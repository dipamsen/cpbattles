import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Look for token in hash (#token=...)
    const hash = window.location.hash || "";
    const tokenMatch = hash.match(/token=([^&]+)/);
    let token = null;
    if (tokenMatch) {
      token = decodeURIComponent(tokenMatch[1]);
    } else {
      // fallback to query param
      const params = new URLSearchParams(window.location.search);
      token = params.get("token");
    }

    if (token) {
      localStorage.setItem("token", token);
    }

    // remove token from URL and navigate home
    window.history.replaceState({}, document.title, "/");
    navigate("/");
  }, [navigate]);

  return <div className="p-8">Logging you in...</div>;
}
