import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  apiFetch: vi.fn(),
  buildQueryParams: vi.fn((params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      searchParams.append(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }),
}));


import { apiFetch } from "../api";
import { notificationService } from "../notificationService";

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista notificações com filtro de não lidas", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);

    await notificationService.findMyNotifications(true);

    expect(apiFetch).toHaveBeenCalledWith("/notifications?unreadOnly=true", {
      method: "GET",
    });
  });

  it("conta notificações não lidas", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ count: 5 });

    await expect(notificationService.countUnreadNotifications()).resolves.toBe(5);

    expect(apiFetch).toHaveBeenCalledWith("/notifications/unread-count", {
      method: "GET",
    });
  });

  it("marca como lida, marca todas e remove", async () => {
    vi.mocked(apiFetch).mockResolvedValue({});

    await notificationService.markAsRead(1);
    await notificationService.markAllAsRead();
    await notificationService.delete(1);

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/notifications/1/read", {
      method: "PATCH",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/notifications/read-all", {
      method: "PATCH",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(3, "/notifications/1", {
      method: "DELETE",
    });
  });
});
