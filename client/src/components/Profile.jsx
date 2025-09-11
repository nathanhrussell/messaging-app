import { useEffect, useState } from "react";
import { getMe, patchMe, uploadAvatar } from "../lib/api.js";
import EditProfileModal from "./EditProfileModal.jsx";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        if (alive) {
          setUser(me);
          setError("");
        }
      } catch (err) {
        if (alive) {
          setUser(null);
          setError(err?.message || "Failed to fetch profile");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async (updates) => {
    const res = await patchMe(updates);
    setUser(res);
  };

  const handleUpload = async (file) => {
    const res = await uploadAvatar(file);
    setUser(res);
  };

  if (loading) return <div className="text-gray-500">Loading profile…</div>;
  if (!user)
    return (
      <div className="text-red-600">
        <div>Could not load profile.</div>
        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
        <div className="mt-3">
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              // refetch
              (async () => {
                try {
                  const me = await getMe();
                  setUser(me);
                } catch (err) {
                  setError(err?.message || "Failed to fetch profile");
                } finally {
                  setLoading(false);
                }
              })();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl">
      <div className="bg-white dark:bg-[#071025] rounded-xl p-6 shadow mb-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl || "/avatar.svg"}
            alt=""
            className="h-24 w-24 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{user.displayName}</h2>
                {user.tagline && <div className="text-sm text-gray-500">{user.tagline}</div>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              </div>
            </div>
            {user.bio && (
              <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal
        open={editing}
        onClose={() => setEditing(false)}
        user={user}
        onSave={handleSave}
        onUpload={handleUpload}
      />
    </div>
  );
}
