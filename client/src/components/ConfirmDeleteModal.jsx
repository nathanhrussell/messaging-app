import React from "react";
import PropTypes from "prop-types";

export default function ConfirmDeleteModal({ open, onClose, onConfirm, conversation }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-2 text-red-800 dark:text-red-200">Confirm delete</h3>
        <p className="text-sm text-red-700 dark:text-red-200 mb-4">
          Are you sure you want to delete this conversation? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border border-red-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
            onClick={() => onConfirm(conversation)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmDeleteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  conversation: PropTypes.object,
};
