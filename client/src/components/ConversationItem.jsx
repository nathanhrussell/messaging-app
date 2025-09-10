import { useCallback } from "react";
import PropTypes from "prop-types";
import { deleteConversation } from "../lib/api";

function lastMessagePreview(lastMessage) {
  if (!lastMessage?.body) return "";
  const s = lastMessage.body.trim().replace(/\s+/g, " ");
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

export default function ConversationItem({ convo, onClick, onDelete }) {
  const { id, partner, lastMessage, unreadCount, flags } = convo;

  const handleDelete = useCallback(
    async (e) => {
      // require double-click to trigger: this handler is called from onDoubleClick
      e.stopPropagation();
      try {
        await deleteConversation(id);
        if (typeof onDelete === "function") onDelete(id);
      } catch (err) {
        // keep behaviour minimal: log and optionally you can add UI feedback
        // eslint-disable-next-line no-console
        console.error("Failed to delete conversation", err);
        // could add toast/alert here
      }
    },
    [id, onDelete]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="w-full text-left p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition flex gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden shrink-0">
        {partner.avatarUrl ? (
          <img
            src={partner.avatarUrl}
            alt={`${partner.displayName}'s avatar`}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{partner.displayName}</span>
          {flags?.isFavourite && (
            <span title="Favourite" className="text-yellow-500">
              ★
            </span>
          )}
          {flags?.isArchived && (
            <span title="Archived" className="text-gray-400">
              ⛃
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 truncate">
          {lastMessage ? lastMessagePreview(lastMessage) : "No messages yet"}
        </div>
      </div>

      {unreadCount > 0 && (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white self-center">
          {unreadCount}
        </span>
      )}

      {/* Delete button: requires double-click to confirm. Stop propagation so it doesn't trigger selection. */}
      <button
        type="button"
        title="Delete conversation (double-click to confirm)"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDelete}
        className="ml-3 text-gray-400 hover:text-red-500 px-2 py-1 rounded"
      >
        🗑
      </button>
    </div>
  );
}

ConversationItem.propTypes = {
  convo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    partner: PropTypes.shape({
      avatarUrl: PropTypes.string,
      displayName: PropTypes.string.isRequired,
    }).isRequired,
    lastMessage: PropTypes.shape({
      body: PropTypes.string.isRequired,
    }),
    unreadCount: PropTypes.number.isRequired,
    flags: PropTypes.shape({
      isFavourite: PropTypes.bool,
      isArchived: PropTypes.bool,
    }),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};
