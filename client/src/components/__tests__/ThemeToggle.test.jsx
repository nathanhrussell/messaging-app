import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../../App.jsx";

// Mock network-heavy API functions used in App to speed up and stabilize test
jest.mock("../../lib/api.js", () => ({
  getConversations: jest.fn().mockResolvedValue([]),
  createConversation: jest.fn(),
  setAccessToken: jest.fn(),
  patchParticipantFlags: jest.fn(),
  deleteConversation: jest.fn(),
  getMessages: jest.fn().mockResolvedValue([]),
  getUser: jest.fn(),
  getMe: jest.fn().mockResolvedValue({ id: "me", displayName: "Me" }),
  refreshToken: jest
    .fn()
    .mockResolvedValue({ accessToken: "t", user: { id: "me", displayName: "Me" } }),
}));

// Mock socket client to avoid real connections
jest.mock("../../lib/socket.js", () => ({
  __esModule: true,
  default: { connectSocket: jest.fn(), disconnectSocket: jest.fn() },
  joinConversation: jest.fn(),
  sendMessageSocket: jest.fn(),
}));

describe("Theme toggle in Settings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  function renderApp() {
    localStorage.setItem("accessToken", "t");
    return render(<App />);
  }

  it("switches to dark mode when Dark selected", () => {
    const { getByText, getByLabelText } = renderApp();
    fireEvent.click(getByText("Settings"));
    fireEvent.click(getByLabelText(/Dark/i, { selector: "input" }));
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("switches back to light mode when Light selected", () => {
    const { getByText, getByLabelText } = renderApp();
    fireEvent.click(getByText("Settings"));
    fireEvent.click(getByLabelText(/Dark/i, { selector: "input" }));
    fireEvent.click(getByLabelText(/Light/i, { selector: "input" }));
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
