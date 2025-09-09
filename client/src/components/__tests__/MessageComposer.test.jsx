import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import MessageComposer from "../MessageComposer.jsx";

describe("MessageComposer", () => {
  it("calls onSend with message body", async () => {
    const onSend = jest.fn().mockResolvedValue();
    const { getByPlaceholderText, getByText } = render(<MessageComposer onSend={onSend} />);
    const textarea = getByPlaceholderText(/Type a message/i);
    fireEvent.change(textarea, { target: { value: "Hello!" } });
    fireEvent.click(getByText(/Send/i));
    expect(onSend).toHaveBeenCalledWith("Hello!");
  });

  it("disables send button when input is empty", () => {
    const { getByText } = render(<MessageComposer onSend={() => {}} />);
    expect(getByText(/Send/i)).toBeDisabled();
  });
});
