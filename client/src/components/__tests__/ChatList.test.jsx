import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import ChatList from "../ChatList";

const sampleConvo = (overrides = {}) => ({
  id: "1",
  partner: { displayName: "Alice", avatarUrl: "" },
  lastMessage: { text: "Hello there!" },
  myParticipant: { isFavourite: false, isArchived: false },
  ...overrides,
});

describe("ChatList", () => {
  it("toggles favourite and shows error on failure", async () => {
    const items = [sampleConvo()];
    const onSelect = jest.fn();
    // Patch API to fail
    jest
      .spyOn(require("../../lib/api"), "patchParticipantFlags")
      .mockRejectedValue(new Error("fail"));
    const { getByTitle, findByText } = render(<ChatList items={items} onSelect={onSelect} />);
    fireEvent.click(getByTitle("Favourite"));
    // Should show error message after failure
    await findByText(/Could not update/);
  });
});
