import { useEffect, useState } from "react";
import {
  getConversations,
  createConversation,
  setAccessToken,
  patchParticipantFlags,
  deleteConversation,
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
  const [error, setError] = useState("");

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
    // Reconnect socket with new token after login
    socketClient.connectSocket();
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
    const conversation = convos.find((c) => c.id === conversationId);
    if (conversation && conversation.isArchived && !current) {
      setError("Cannot favourite an archived chat. Unarchive it first.");
      return;
    }
    try {
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isFavourite: !current } : c))
      );
      await patchParticipantFlags(conversationId, { isFavourite: !current });
    } catch (err) {
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isFavourite: current } : c))
      );
      setError("Failed to update favourite status.");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const toggleArchived = async (conversationId, current) => {
    const conversation = convos.find((c) => c.id === conversationId);
    if (conversation && conversation.isFavourite && !current) {
      setError("Cannot archive a favourited chat. Unfavourite it first.");
      return;
    }
    try {
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: !current } : c))
      );
      await patchParticipantFlags(conversationId, { isArchived: !current });
    } catch (err) {
      setConvos((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isArchived: current } : c))
      );
      setError("Failed to update archived status.");
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

  // Always show all conversations in the right column, filter by tab
  const chatsConvos = convos.filter((c) => !c.isArchived);
  const favouritesConvos = convos.filter((c) => c.isFavourite);
  const archivedConvos = convos.filter((c) => c.isArchived);

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
    <div className="min-h-screen grid md:grid-cols-[5rem_1fr_22rem] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Left: Navigation sidebar */}
      <Sidebar active={nav} onNavigate={handleNavigate} />

      {/* Center: Main content changes by nav */}
      <main className="flex-1 p-8">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            <span
              className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
              onClick={() => setError("")}
            >
              <svg
                className="fill-current h-6 w-6 text-red-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}
        {activeConvo && nav === "chats" ? (
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
        ) : nav === "favourites" ? (
          <div className="text-xl font-semibold mb-2">Favourites</div>
        ) : nav === "archived" ? (
          <div className="text-xl font-semibold mb-2">Archived</div>
        ) : nav === "profile" ? (
          <div className="text-xl font-semibold mb-2">Profile (coming soon)</div>
        ) : nav === "settings" ? (
          <div className="text-xl font-semibold mb-2">Settings (coming soon)</div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">Welcome</h1>
            <p className="text-sm text-gray-500">Select a conversation from the right list.</p>
          </>
        )}
      </main>

      {/* Right: Conversation list always visible */}
      <aside className="w-full border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#071025] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Chats</h2>
          <button
            className="bg-[#3B82F6] text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-600 transition"
            onClick={() => setShowNewModal(true)}
          >
            + New
          </button>
        </div>
        {/* Show correct list based on nav */}
        {nav === "favourites" ? (
          favouritesConvos.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No favourites</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {favouritesConvos.map((c) => (
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
                        {c.partner && c.partner.displayName}
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
                      <button
                        type="button"
                        title="Delete conversation (double-click to confirm)"
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await deleteConversation(c.id);
                            setConvos((prev) => prev.filter((x) => x.id !== c.id));
                            if (activeConvo?.id === c.id) setActiveConvo(null);
                          } catch (err) {
                            // eslint-disable-next-line no-console
                            console.error("Failed to delete conversation", err);
                            setError("Could not delete conversation. Please try again.");
                            setTimeout(() => setError(""), 4000);
                          }
                        }}
                        className="px-2 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 hover:text-red-500"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : nav === "archived" ? (
          archivedConvos.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No archived</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {archivedConvos.map((c) => (
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
                        {c.partner && c.partner.displayName}
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
                      <button
                        type="button"
                        title="Delete conversation (double-click to confirm)"
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await deleteConversation(c.id);
                            setConvos((prev) => prev.filter((x) => x.id !== c.id));
                            if (activeConvo?.id === c.id) setActiveConvo(null);
                          } catch (err) {
                            // eslint-disable-next-line no-console
                            console.error("Failed to delete conversation", err);
                            setError("Could not delete conversation. Please try again.");
                            setTimeout(() => setError(""), 4000);
                          }
                        }}
                        className="px-2 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 hover:text-red-500"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : chatsConvos.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No conversations</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {chatsConvos.map((c) => (
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
                      {c.partner && c.partner.displayName}
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
                    <button
                      type="button"
                      title="Delete conversation (double-click to confirm)"
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await deleteConversation(c.id);
                          setConvos((prev) => prev.filter((x) => x.id !== c.id));
                          if (activeConvo?.id === c.id) setActiveConvo(null);
                        } catch (err) {
                          // eslint-disable-next-line no-console
                          console.error("Failed to delete conversation", err);
                          setError("Could not delete conversation. Please try again.");
                          setTimeout(() => setError(""), 4000);
                        }
                      }}
                      className="px-2 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 hover:text-red-500"
                    >
                      🗑
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
      </aside>
    </div>
  );
}
