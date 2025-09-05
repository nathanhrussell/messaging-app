import PropTypes from "prop-types";

function lastMessagePreview(lastMessage) {
  if (!lastMessage?.body) return "";
  const s = lastMessage.body.trim().replace(/\s+/g, " ");
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

export default function ConversationItem({ convo, onClick }) {
  const { partner, lastMessage, unreadCount, flags } = convo;

  return (
    <button
      onClick={onClick}
      type="button"
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
    </button>
  );
}

ConversationItem.propTypes = {
  convo: PropTypes.shape({
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
};
