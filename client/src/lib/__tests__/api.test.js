import { deleteConversation } from "../api";

describe("deleteConversation", () => {
  const OLD_FETCH = global.fetch;

  afterEach(() => {
    global.fetch = OLD_FETCH;
    jest.resetAllMocks();
  });

  test("sends DELETE to the correct URL and returns parsed json on success", async () => {
    const mockResponse = { ok: true };
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockResponse) })
    );

    const res = await deleteConversation("conv-123");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/conversations/conv-123", expect.objectContaining({ method: "DELETE" }));
    expect(res).toEqual(mockResponse);
  });

  test("throws when conversationId is invalid", async () => {
    await expect(deleteConversation()).rejects.toThrow("conversationId is required");
    await expect(deleteConversation(123)).rejects.toThrow("conversationId is required");
  });
});
