import { useEffect, useState } from "react";
import {
  getConversations,
  createConversation,
  setAccessToken,
  patchParticipantFlags,
} from "./lib/api.js";
import socketClient, { joinConversation, sendMessageSocket } from "./lib/socket.js";
import Sidebar from "./components/Sidebar.jsx";
import NewConversationModal from "./components/NewConversationModal.jsx";
import MessageList from "./components/MessageList.jsx";
import MessageComposer from "./components/MessageComposer.jsx";
import AuthForm from "./components/AuthForm.jsx";

export default function App() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(
    () => localStorage.getItem("accessToken") || ""
  );
  const [authLoading, setAuthLoading] = useState(true);
  const [nav, setNav] = useState("chats");
  const [showNewModal, setShowNewModal] = useState(false);

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

  // Silent refresh on mount
  useEffect(() => {
    async function tryRefresh() {
      setAuthLoading(true);
      try {
        const res = await refreshToken();
        if (res.accessToken) {
          setAccessToken(res.accessToken);
          localStorage.setItem("accessToken", res.accessToken);
          setUser(res.user || null);
          socketClient.connectSocket();
        }
      } catch {
        setUser(null);
        setAccessToken("");
        localStorage.removeItem("accessToken");
      } finally {
        setAuthLoading(false);
      }
    }
    if (!accessToken) {
      tryRefresh();
    } else {
      socketClient.connectSocket();
      setAuthLoading(false);
    }
  }, [accessToken]);

  const handleAuth = (res) => {
    setAccessToken(res.accessToken);
    setAccessTokenState(res.accessToken); // ensure localStorage is updated for authHeaders
    setUser(res.user || null);
  };

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

  const toggleFavourite = async (conversationId, current) => {
    try {
      // optimistic update
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isFavourite: !current } : c))
      );
      await patchParticipantFlags(conversationId, { isFavourite: !current });
    } catch (err) {
      // revert on error
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isFavourite: current } : c))
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const toggleArchived = async (conversationId, current) => {
    try {
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: !current } : c))
      );
      await patchParticipantFlags(conversationId, { isArchived: !current });
    } catch (err) {
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: current } : c))
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  // Fetch conversations on login and after new convo
  useEffect(() => {
    if (accessToken) {
      setAccessToken(accessToken); // always update localStorage for authHeaders
      getConversations()
        .then(setConvos)
        .catch(() => setConvos([]));
    }
  }, [accessToken]);

  // Filter conversations for main content
  const filteredConvos = convos.filter((c) => {
    if (nav === "favourites") return c.isFavourite;
    if (nav === "archived") return c.isArchived;
    return nav === "chats";
  });

  const handleNewConversation = async (emailOrId) => {
    const convo = await createConversation(emailOrId);
    // refetch to ensure partner and lastMessage populated
    const latest = await getConversations();
    setConvos(latest);
    setShowNewModal(false);
  };

  const handleNavigate = (key) => {
    if (key === "logout") {
      socketClient.disconnectSocket();
      setAccessToken("");
      localStorage.removeItem("accessToken");
      setUser(null);
      setConvos([]);
      setNav("chats");
      window.location.reload();
      return;
    }
    setNav(key);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] text-[#3B82F6] text-xl">
        Loading…
      </div>
    );
  }

  if (!accessToken) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <Sidebar active={nav} onNavigate={handleNavigate} />
      {/* Main content area */}
      <main className="flex-1 p-8">
        {nav === "chats" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Chats</h2>
              <button
                className="bg-[#3B82F6] text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-600 transition"
                onClick={() => setShowNewModal(true)}
              >
                + New
              </button>
            </div>
            {filteredConvos.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No conversations</div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredConvos.map((c) => (
                  <li
                    key={c.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${activeConvo?.id === c.id ? "bg-blue-50 dark:bg-[#1F2937]" : ""}`}
                    onClick={() => setActiveConvo(c)}
                  >
                    <img
                      src={c.partner && c.partner.avatarUrl ? c.partner.avatarUrl : "/avatar.svg"}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#111827] dark:text-[#F9FAFB] truncate">
                          {c.partner.displayName}
                        </span>
                        {c.isFavourite && (
                          <span title="Favourite" className="text-yellow-400">
                            ★
                          </span>
                        )}
                        {c.isArchived && (
                          <span title="Archived" className="text-gray-400">
                            ⧉
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {c.lastMessage ? (
                          c.lastMessage.body
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {c.unreadCount > 0 && (
                        <span className="ml-2 bg-[#3B82F6] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          {c.unreadCount}
                        </span>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          title={c.isFavourite ? "Unfavourite" : "Favourite"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(c.id, c.isFavourite);
                          }}
                          className={`px-2 py-1 rounded text-sm ${c.isFavourite ? "bg-yellow-400 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          title={c.isArchived ? "Unarchive" : "Archive"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleArchived(c.id, c.isArchived);
                          }}
                          className={`px-2 py-1 rounded text-sm ${c.isArchived ? "bg-gray-400 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}
                        >
                          ⧉
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <NewConversationModal
              open={showNewModal}
              onClose={() => setShowNewModal(false)}
              onCreate={handleNewConversation}
            />
          </>
        )}
        {nav === "profile" && <div className="text-xl">Profile (coming soon)</div>}
        {nav === "favourites" && <div className="text-xl">Favourites (see chats tab)</div>}
        {nav === "archived" && <div className="text-xl">Archived (see chats tab)</div>}
        {nav === "settings" && <div className="text-xl">Settings (coming soon)</div>}
      </main>

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
