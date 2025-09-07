import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./lib/socket.js";
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);
