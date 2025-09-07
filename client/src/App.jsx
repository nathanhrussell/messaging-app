import { useEffect, useState } from "react";
import { getConversations } from "./lib/api.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatList from "./components/ChatList.jsx";

export default function App() {
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
    <div className="min-h-screen grid md:grid-cols-[5rem_22rem_1fr] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Left: sidebar with icons + labels on xl */}
      <Sidebar />

      {/* Middle: chat list */}
      <aside className="border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        <ChatList
          items={convos}
          isLoading={loading}
          error={err}
          onSelect={(c) => setActiveConvo(c)}
          activeId={activeConvo?.id}
        />
      </aside>

      {/* Right: chat window */}
      <main className="p-6 overflow-y-auto">
        {activeConvo ? (
          <>
            <header className="flex items-center gap-3 mb-4">
              <img
                src={activeConvo.partner.avatarUrl || "/avatar.svg"}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <h1 className="text-xl font-semibold">{activeConvo.partner.displayName}</h1>
            </header>
            <p className="text-sm text-gray-500">Conversation ID: {activeConvo.id}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">Welcome</h1>
            <p className="text-sm text-gray-500">Select a conversation from the middle list.</p>
          </>
        )}
      </main>
    </div>
  );
}
