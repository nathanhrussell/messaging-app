import { useEffect, useState } from "react";
import {
  getConversations,
  createConversation,
  setAccessToken,
  patchParticipantFlags,
  deleteConversation,
  getMessages,
  getUser,
} from "./lib/api.js";
import socketClient, { joinConversation, sendMessageSocket } from "./lib/socket.js";
import Sidebar from "./components/Sidebar.jsx";
import NewConversationModal from "./components/NewConversationModal.jsx";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal.jsx";
import DeleteResultModal from "./components/DeleteResultModal.jsx";
import MessageList from "./components/MessageList.jsx";
import MessageComposer from "./components/MessageComposer.jsx";
import AuthForm from "./components/AuthForm.jsx";
import Profile from "./components/Profile.jsx";
import UserProfileModal from "./components/UserProfileModal.jsx";

export default function App() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  // Only store the ID initially, but don't set activeConvo to a partial object
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(
    () => localStorage.getItem("accessToken") || ""
  );
  const [authLoading, setAuthLoading] = useState(true);
  const [nav, setNav] = useState(() => localStorage.getItem("activeTab") || "chats");
  // Persist nav (sidebar tab) to localStorage
  useEffect(() => {
    if (nav) {
      localStorage.setItem("activeTab", nav);
    }
  }, [nav]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteResult, setDeleteResult] = useState({ open: false, type: "success", message: "" });
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);

  // TODO: Replace with real user ID from auth context
  const userId = "TODO_USER_ID";

  // Restore active conversation from localStorage on mount, after conversations are loaded, but only if nav is 'chats'
  useEffect(() => {
    if (!loading && convos.length > 0 && nav === "chats") {
      const savedId = localStorage.getItem("activeConvoId");
      if (savedId) {
        const found = convos.find((c) => c.id === savedId);
        if (found) setActiveConvo(found);
      }
    }
    // If not on chats tab, clear activeConvo
    if (nav !== "chats") {
      setActiveConvo(null);
    }
  }, [loading, convos, nav]);

  // Immediately set a minimal activeConvo from localStorage when on the chats tab
  // This ensures the chat view appears right away after refresh and messages begin loading.
  useEffect(() => {
    if (nav !== "chats") return;
    const savedId = localStorage.getItem("activeConvoId");
    if (savedId && !activeConvo) {
      // set a shallow object with only id so message fetching and joinConversation can run
      setActiveConvo({ id: savedId });
    }
  }, [nav, activeConvo]);

  // Persist activeConvoId to localStorage
  useEffect(() => {
    if (activeConvo && activeConvo.id) {
      localStorage.setItem("activeConvoId", activeConvo.id);
    } else {
      localStorage.removeItem("activeConvoId");
    }
  }, [activeConvo]);

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

    console.log("Loading messages for conversation:", activeConvo.id);
    let alive = true;
    setMessagesLoading(true);

    (async () => {
      try {
        console.log("Calling getMessages with:", activeConvo.id);
        const msgs = await getMessages(activeConvo.id, { limit: 30 });
        console.log("getMessages returned:", msgs);

        if (alive) {
          setMessages(msgs);
          console.log("Messages set to:", msgs);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
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

  // Scroll active conversation into view when it's selected/restored and chats tab is visible
  useEffect(() => {
    if (nav !== "chats" || !activeConvo || !activeConvo.id) return;
    // Delay to allow DOM to render the list
    const t = setTimeout(() => {
      const el = document.getElementById(`convo-${activeConvo.id}`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 100);
    return () => clearTimeout(t);
  }, [activeConvo, nav]);

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
      localStorage.setItem("activeTab", "chats");
      window.location.reload();
      return;
    }
    setNav(key);
    localStorage.setItem("activeTab", key);
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
                src={
                  activeConvo.partner && activeConvo.partner.avatarUrl
                    ? activeConvo.partner.avatarUrl
                    : "/avatar.svg"
                }
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <h1 className="text-xl font-semibold">
                {activeConvo.partner ? (
                  // clickable link-like name: open modal and fetch full profile
                  <button
                    type="button"
                    onClick={async () => {
                      const p = activeConvo.partner;
                      if (!p) return;
                      // optimistically show minimal partner info immediately
                      setModalUser(p);
                      setShowUserModal(true);
                      try {
                        const full = await getUser(p.id);
                        setModalUser(full);
                      } catch (err) {
                        // keep optimistic data and surface an error
                        setError((e) => e || "Could not load full profile");
                        // eslint-disable-next-line no-console
                        console.error("Failed to fetch full profile", err);
                      }
                    }}
                    className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer focus:outline-none"
                    aria-label={`Open profile for ${activeConvo.partner.displayName}`}
                    title={`View ${activeConvo.partner.displayName}'s profile`}
                  >
                    {activeConvo.partner.displayName}
                  </button>
                ) : (
                  ""
                )}
              </h1>
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
          <Profile />
        ) : nav === "settings" ? (
          <div className="text-xl font-semibold mb-2">Settings (coming soon)</div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">Welcome</h1>
            <p className="text-sm text-gray-500">Select a conversation from the list.</p>
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
                  id={`convo-${c.id}`}
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
                        title="Delete conversation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(c);
                          setShowDeleteModal(true);
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
                  id={`convo-${c.id}`}
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
                        title="Delete conversation"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(c);
                          setShowDeleteModal(true);
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
                id={`convo-${c.id}`}
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
                      title="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(c);
                        setShowDeleteModal(true);
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
        <ConfirmDeleteModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPendingDelete(null);
          }}
          conversation={pendingDelete}
          onConfirm={async (conversation) => {
            if (!conversation) return;
            try {
              await deleteConversation(conversation.id);
              setConvos((prev) => prev.filter((x) => x.id !== conversation.id));
              if (activeConvo?.id === conversation.id) setActiveConvo(null);
              setDeleteResult({ open: true, type: "success", message: "Conversation deleted" });
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("Failed to delete conversation", err);
              setDeleteResult({
                open: true,
                type: "error",
                message: "Could not delete conversation. Please try again.",
              });
            } finally {
              setShowDeleteModal(false);
              setPendingDelete(null);
            }
          }}
        />
        <DeleteResultModal
          open={deleteResult.open}
          type={deleteResult.type}
          message={deleteResult.message}
          onClose={() => setDeleteResult((r) => ({ ...r, open: false }))}
        />
        <UserProfileModal
          open={showUserModal && !!modalUser}
          onClose={() => {
            setShowUserModal(false);
            setModalUser(null);
          }}
          user={modalUser}
        />
      </aside>
    </div>
  );
}
