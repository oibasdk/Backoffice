import { vi } from "vitest";
import { ApiError, request } from "../../api/client";

const mockFetch = (response: Partial<Response> & { json?: () => Promise<any>; text?: () => Promise<string> }) => {
  global.fetch = vi.fn().mockResolvedValue(response);
};

test("normalizes json error responses", async () => {
  mockFetch({
    ok: false,
    status: 403,
    statusText: "Forbidden",
    headers: new Headers({ "content-type": "application/json", "X-Request-ID": "req-123" }),
    json: async () => ({ message: "Forbidden", details: { reason: "policy" } }),
  });

  await expect(request("/bff/admin/blocked")).rejects.toMatchObject({
    code: 403,
    message: "Forbidden",
    details: { reason: "policy" },
    requestId: "req-123",
  });
});

test("normalizes non-json error responses", async () => {
  mockFetch({
    ok: false,
    status: 500,
    statusText: "Server Error",
    headers: new Headers({ "content-type": "text/plain" }),
    text: async () => "Boom",
  });

  try {
    await request("/bff/admin/boom");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.code).toBe(500);
    expect(apiError.message).toBe("Server Error");
  }
});
