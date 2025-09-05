import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getConversations } from "./lib/api.js";
import Sidebar from "./components/Sidebar.jsx";

function App() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeConvo, setActiveConvo] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getConversations();
        if (alive) setConvos(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen grid md:grid-cols-[24rem_1fr] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Sidebar items={convos} isLoading={loading} error={err} onSelect={(c) => setActiveConvo(c)} />
      <main className="p-6">
        {activeConvo ? (
          <>
            <h1 className="text-xl font-semibold mb-2">{activeConvo.partner.displayName}</h1>
            <p className="text-sm text-gray-500">Conversation ID: {activeConvo.id}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">Welcome</h1>
            <p className="text-sm text-gray-500">Select a conversation from the left.</p>
          </>
        )}
      </main>
    </div>
  );
}

App.propTypes = {
  convos: PropTypes.array,
  loading: PropTypes.bool,
  err: PropTypes.string,
  activeConvo: PropTypes.object,
};

export default App;
