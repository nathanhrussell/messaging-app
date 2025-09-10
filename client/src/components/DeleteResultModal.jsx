import React, { useEffect } from "react";
import PropTypes from "prop-types";

export default function DeleteResultModal({ open, type, message, onClose, autoCloseMs = 2500 }) {
  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => onClose(), autoCloseMs);
    return () => clearTimeout(id);
  }, [open, onClose, autoCloseMs]);

  if (!open) return null;

  const isError = type === "error";
  const bg = isError
    ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700";
  const text = isError ? "text-red-800 dark:text-red-100" : "text-green-800 dark:text-green-100";

  return (
    <div className="fixed inset-0 flex items-start justify-center pointer-events-none z-50">
      <div className="mt-8 w-full max-w-md px-4">
        <div
          className={`pointer-events-auto rounded-lg shadow-lg border ${bg} p-4 flex items-start gap-3`}
        >
          <div className={`flex-shrink-0 mt-0.5 ${isError ? "text-red-600" : "text-green-600"}`}>
            {isError ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className={`font-medium ${text}`}>{message}</div>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

DeleteResultModal.propTypes = {
  open: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(["success", "error"]).isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  autoCloseMs: PropTypes.number,
};
