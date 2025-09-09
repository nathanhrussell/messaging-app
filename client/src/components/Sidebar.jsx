// Sidebar.jsx
import React from "react";
import PropTypes from "prop-types";

const navItems = [
  { key: "chats", label: "Chats", icon: "💬" },
  { key: "favourites", label: "Favourites", icon: "★" },
  { key: "archived", label: "Archived", icon: "⧉" },
  { key: "profile", label: "Profile", icon: "👤" },
  { key: "settings", label: "Settings", icon: "⚙️" },
  { key: "logout", label: "Logout", icon: "🚪" },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="flex flex-col h-full w-20 bg-white dark:bg-[#232b3a] border-r border-gray-200 dark:border-gray-800 py-4">
      <div className="flex flex-col gap-4 items-center flex-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl w-16 transition text-sm font-medium ${active === item.key ? 'bg-[#3B82F6] text-white' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="text-2xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  active: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};
