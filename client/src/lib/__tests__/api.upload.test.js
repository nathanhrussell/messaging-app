/* eslint-env jest */
import { uploadAvatar } from "../api.js";

describe("uploadAvatar", () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  it("posts FormData and returns json on success", async () => {
    const file = new File(["abc"], "avatar.jpg", { type: "image/jpeg" });
    const mockJson = { avatarUrl: "https://cdn.example/avatar.jpg" };
    globalThis.fetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(mockJson) });

    const res = await uploadAvatar(file);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("/api/users/me/avatar");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);

    // Verify FormData contains the file under 'avatar'
    const fd = opts.body;
    expect(fd.get("avatar")).toBe(file);

    expect(res).toEqual(mockJson);
  });

  it("throws when response not ok", async () => {
    globalThis.fetch.mockResolvedValue({ ok: false, json: jest.fn().mockResolvedValue({ error: "bad" }), statusText: "Bad" });
    await expect(uploadAvatar(new File(["a"], "f.png", { type: "image/png" }))).rejects.toThrow();
  });
});
