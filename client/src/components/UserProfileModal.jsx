import PropTypes from "prop-types";

export default function UserProfileModal({ open, onClose, user }) {
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#232b3a] rounded-2xl shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex flex-col items-center gap-4">
          <img
            src={user.avatarUrl || "/avatar.svg"}
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
          <h2 className="text-2xl font-bold">{user.displayName}</h2>
          {user.tagline && <div className="text-sm text-gray-500">{user.tagline}</div>}
          {user.bio && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{user.bio}</p>}
        </div>
      </div>
    </div>
  );
}

UserProfileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    avatarUrl: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    tagline: PropTypes.string,
    bio: PropTypes.string,
  }),
};
