import { useState } from "react";
import PropTypes from "prop-types";

export default function MessageComposer({ onSend, disabled }) {
  const [body, setBody] = useState("");

  const sendMessage = async (text) => {
    const trimmed = (text ?? body).trim();
    if (!trimmed) return;
    await onSend(trimmed);
    setBody("");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (disabled) return;
    await sendMessage(body);
  };

  const handleKeyDown = async (e) => {
    // Don't interfere with IME composition
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      // Prevent newline and submit
      e.preventDefault();
      if (disabled) return;
      await sendMessage(body);
    }
  };

  return (
    <form className="flex gap-2 mt-4" onSubmit={handleSend}>
      <textarea
        className="flex-1 rounded border px-3 py-2"
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        disabled={disabled}
        style={{ resize: "none" }}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={disabled || !body.trim()}
      >
        Send
      </button>
    </form>
  );
}

MessageComposer.propTypes = {
  onSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

MessageComposer.defaultProps = {
  disabled: false,
};
