import PropTypes from "prop-types";
import ConversationItem from "./ConversationItem.jsx";

export default function Sidebar({ items, isLoading, error, onSelect }) {
  return (
    <aside className="w-full md:w-96 border-r border-gray-200 dark:border-gray-800 h-screen overflow-y-auto p-3 bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-3">Chats</h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm break-words">Error loading conversations: {error}</div>
      ) : items?.length ? (
        <div className="space-y-1">
          {items.map((c) => (
            <ConversationItem key={c.id} convo={c} onClick={() => onSelect?.(c)} />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No conversations yet</div>
      )}
    </aside>
  );
}

Sidebar.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onSelect: PropTypes.func,
};
