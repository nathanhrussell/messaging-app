import { useState } from "react";
import PropTypes from "prop-types";
import { patchParticipantFlags, deleteConversation } from "../lib/api.js";

export default function ChatList({ items, isLoading, error, onSelect, activeId, onDelete }) {
  const [, setTick] = useState(0); // force re-render after optimistic mutation
  const [updateError, setUpdateError] = useState("");
  const force = () => setTick((t) => t + 1);

  if (isLoading) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  if (error)
    return <div className="p-4 text-sm text-red-600">Error loading conversations: {error}</div>;
  if (!items.length) return <div className="p-4 text-sm text-gray-500">No conversations yet.</div>;

  return (
    <>
      {updateError && (
        <div className="p-2 text-sm text-red-600 bg-red-50 rounded mb-2">{updateError}</div>
      )}
      <ul className="divide-y divide-gray-200 dark:divide-gray-800">
        {items.map((c) => {
          const last = c.lastMessage?.text || "No messages yet";
          const isActive = activeId === c.id;
          const fav = !!c.myParticipant?.isFavourite;
          const arch = !!c.myParticipant?.isArchived;

          const toggle = (key) => async (e) => {
            e.stopPropagation();
            setUpdateError("");
            const prev = c.myParticipant?.[key] ?? false;
            const next = !prev;

            // optimistic: ensure object exists, flip value, re-render
            c.myParticipant = { ...(c.myParticipant || {}), [key]: next };
            force();

            try {
              await patchParticipantFlags(c.id, { [key]: next });
            } catch {
              // revert on failure
              c.myParticipant[key] = prev;
              force();
              setUpdateError("Could not update. Please try again.");
            }
          };

          return (
            <li key={c.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(c);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  isActive ? "bg-gray-100 dark:bg-gray-900" : ""
                } ${arch ? "opacity-60" : ""}`}
              >
                <img
                  src={c.partner?.avatarUrl || "/avatar.svg"}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                />

                <div className="min-w-0">
                  <div className="font-medium truncate">{c.partner?.displayName || "Unknown"}</div>
                  <div className="text-sm text-gray-500 truncate">{last}</div>
                </div>

                {/* action buttons */}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    title={fav ? "Unfavourite" : "Favourite"}
                    onClick={toggle("isFavourite")}
                    className={`px-2 text-sm ${fav ? "text-yellow-500" : "text-gray-400"} hover:text-yellow-600`}
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    title={arch ? "Unarchive" : "Archive"}
                    onClick={toggle("isArchived")}
                    className={`px-2 text-sm ${arch ? "text-blue-600" : "text-gray-400"} hover:text-blue-700`}
                  >
                    🗄
                  </button>
                  <button
                    type="button"
                    title="Delete conversation (double-click to confirm)"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deleteConversation(c.id);
                        if (typeof onDelete === "function") onDelete(c.id);
                      } catch (err) {
                        // minimal handling: show console and set updateError
                        // eslint-disable-next-line no-console
                        console.error("Failed to delete conversation", err);
                        // show a transient error message
                        // re-use setUpdateError in this scope via closure
                        setUpdateError("Could not delete conversation. Please try again.");
                        setTimeout(() => setUpdateError(""), 4000);
                      }
                    }}
                    className="px-2 text-sm text-gray-400 hover:text-red-500"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

ChatList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      partner: PropTypes.shape({
        displayName: PropTypes.string,
        avatarUrl: PropTypes.string,
      }),
      lastMessage: PropTypes.shape({ text: PropTypes.string }),
      myParticipant: PropTypes.shape({
        isFavourite: PropTypes.bool,
        isArchived: PropTypes.bool,
      }),
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  activeId: PropTypes.string,
  onDelete: PropTypes.func,
};

ChatList.defaultProps = {
  isLoading: false,
  error: "",
  activeId: undefined,
};
