import { useEffect, useState } from "react";
import { getConversations, getMessages } from "./lib/api.js";
import { joinConversation, sendMessageSocket } from "./lib/socket.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatList from "./components/ChatList.jsx";
import MessageList from "./components/MessageList.jsx";
import MessageComposer from "./components/MessageComposer.jsx";

export default function App() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // TODO: Replace with real user ID from auth context
  const userId = "TODO_USER_ID";

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

  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }
    let alive = true;
    setMessagesLoading(true);
    (async () => {
      try {
        const msgs = await getMessages(activeConvo.id, { limit: 30 });
        if (alive) setMessages(msgs);
      } catch {
        if (alive) setMessages([]);
      } finally {
        if (alive) setMessagesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeConvo]);

  useEffect(() => {
    if (activeConvo) {
      joinConversation(activeConvo.id);
    }
  }, [activeConvo]);

  const handleSendMessage = async (body) => {
    if (!activeConvo) return;
    setSending(true);
    sendMessageSocket(activeConvo.id, body, (res) => {
      setSending(false);
      if (res && res.ok && res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      // Optionally handle error
    });
  };

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
            <section className="mt-6">
              {messagesLoading ? (
                <div className="text-gray-500 text-sm">Loading messages…</div>
              ) : (
                <>
                  <MessageList messages={messages} userId={userId} />
                  <MessageComposer onSend={handleSendMessage} disabled={sending} />
                </>
              )}
            </section>
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
