import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./lib/socket.js";
import "./index.css";

// Apply initial theme before React mounts to avoid a flash-of-unstyled (FOUC)
try {
  const stored = localStorage.getItem("theme");
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");
  if (initial === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
} catch (e) {
  // localStorage may be unavailable in some environments; fail silently
}

createRoot(document.getElementById("root")).render(<App />);
