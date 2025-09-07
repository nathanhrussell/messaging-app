/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import PropTypes from "prop-types";

function Item({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex md:flex-col items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
    >
      <span className="text-xl">{icon}</span>
      <span className="hidden xl:block text-sm">{label}</span>
    </button>
  );
}

Item.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

Item.defaultProps = {
  onClick: undefined,
};

export default function Sidebar() {
  return (
    <nav className="border-r border-gray-200 dark:border-gray-800 p-2 flex md:flex-col gap-1">
      <Item icon="💬" label="Chats" />
      <Item icon="⭐" label="Favourites" />
      <Item icon="🗄" label="Archived" />
      <Item icon="👤" label="Profile" />
      <Item icon="⚙️" label="Settings" />
      <Item icon="⎋" label="Logout" />
    </nav>
  );
}
