import PropTypes from "prop-types";

export default function ChatList({ items, isLoading, error, onSelect, activeId }) {
  if (isLoading) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  if (error)
    return <div className="p-4 text-sm text-red-600">Error loading conversations: {error}</div>;
  if (!items.length) return <div className="p-4 text-sm text-gray-500">No conversations yet.</div>;

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {items.map((c) => {
        const last = c.lastMessage?.text || "No messages yet";
        const isActive = activeId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-900 ${
                isActive ? "bg-gray-100 dark:bg-gray-900" : ""
              }`}
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
            </button>
          </li>
        );
      })}
    </ul>
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
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  activeId: PropTypes.string,
};

ChatList.defaultProps = {
  isLoading: false,
  error: "",
  activeId: undefined,
};
