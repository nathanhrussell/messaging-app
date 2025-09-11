import { useState } from "react";
import PropTypes from "prop-types";

export default function EditProfileModal({ open, onClose, user, onSave, onUpload }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [tagline, setTagline] = useState(user?.tagline || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  // sync when user changes
  if (open && user && displayName !== (user.displayName || "")) {
    setDisplayName(user.displayName || "");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave({ displayName, tagline, bio });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    try {
      await onUpload(f);
    } catch (err) {
      setError(err.message || "Upload failed");
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#232b3a] rounded-2xl shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-[#111827] dark:text-[#F9FAFB]">Edit profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display name</label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tagline</label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Avatar</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label
                htmlFor="avatar"
                style={{
                  display: "inline-block",
                  padding: "0.5em 1.5em",
                  background: "#2563eb",
                  color: "white",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "1rem",
                  transition: "background 0.2s",
                  border: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                Choose file
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
              </label>
              <span style={{ color: "#374151" }}>
                {avatarFile ? avatarFile.name : "No file chosen"}
              </span>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white font-semibold hover:bg-blue-600 transition disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

EditProfileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

EditProfileModal.defaultProps = {
  user: null,
};
