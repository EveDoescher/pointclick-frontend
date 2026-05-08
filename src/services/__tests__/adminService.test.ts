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
import { adminService } from "../adminService";

describe("adminService", () => {
  it("busca dashboard administrativo", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ totalOrders: 0 });

    await adminService.getDashboard();

    expect(apiFetch).toHaveBeenCalledWith("/admin/dashboard", {
      method: "GET",
    });
  });
});
