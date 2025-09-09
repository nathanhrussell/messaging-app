import "@testing-library/jest-dom";
import React from "react";
import { render } from "@testing-library/react";
import MessageList from "../MessageList.jsx";

describe("MessageList", () => {
  it("renders no messages", () => {
    const { getByText } = render(<MessageList messages={[]} userId="u1" />);
    expect(getByText(/No messages yet/)).toBeInTheDocument();
  });

  it("renders messages", () => {
    const messages = [
      { id: "m1", body: "Hello", senderId: "u1", createdAt: new Date().toISOString() },
      { id: "m2", body: "Hi", senderId: "u2", createdAt: new Date().toISOString() },
    ];
    const { getByText } = render(<MessageList messages={messages} userId="u1" />);
    expect(getByText("Hello")).toBeInTheDocument();
    expect(getByText("Hi")).toBeInTheDocument();
  });
});
