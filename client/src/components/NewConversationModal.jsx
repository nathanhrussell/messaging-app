import React, { useState } from "react";
import PropTypes from "prop-types";
import { getConversations } from "../lib/api.js";

export default function NewConversationModal({ open, onClose, onCreate }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onCreate(email);
      setEmail("");
      onClose();
    } catch (err) {
      setError(err.message || "Could not create conversation");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#232b3a] rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-[#111827] dark:text-[#F9FAFB]">Start a new conversation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">User email</label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white font-semibold hover:bg-blue-600 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

NewConversationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
