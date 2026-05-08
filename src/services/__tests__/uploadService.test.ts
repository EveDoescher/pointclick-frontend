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
import { uploadService } from "../uploadService";

describe("uploadService", () => {
  it("envia imagem de produto usando FormData", async () => {
    const file = new File(["imagem"], "produto.png", { type: "image/png" });
    vi.mocked(apiFetch).mockResolvedValueOnce({ url: "/uploads/produto.png" });

    await uploadService.uploadProductImage(file);

    expect(apiFetch).toHaveBeenCalledWith(
      "/uploads/products",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });
});
