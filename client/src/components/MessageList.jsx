import PropTypes from "prop-types";

export default function MessageList({ messages, userId }) {
  if (!messages.length) {
    return <div className="text-gray-500 text-sm">No messages yet.</div>;
  }
  return (
    <ul className="space-y-2">
      {messages.map((m) => (
        <li key={m.id} className="flex justify-start">
          <div
            className={`px-3 py-2 rounded-lg ${
              m.senderId === userId
                ? "bg-[#0B93F6] text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            {m.body}
            <span className="block text-xs text-gray-400 mt-1">
              {new Date(m.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      body: PropTypes.string.isRequired,
      senderId: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  userId: PropTypes.string.isRequired,
};
