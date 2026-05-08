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
import { productService } from "../productService";

describe("productService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista produtos públicos com filtros", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);

    await productService.findAll({
      search: "notebook",
      categoryGroup: "Computadores e Mobile",
      available: true,
      sort: "price_asc",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/products?search=notebook&categoryGroup=Computadores+e+Mobile&available=true&sort=price_asc",
      {
        method: "GET",
        auth: false,
      }
    );
  });

  it("lista produtos admin com filtros", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);

    await productService.findAllForAdmin({
      active: false,
      sort: "name_asc",
    });

    expect(apiFetch).toHaveBeenCalledWith("/products/admin?active=false&sort=name_asc", {
      method: "GET",
    });
  });

  it("busca produto, relacionados, categorias, grupos e marcas", async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);

    await productService.findById(1);
    await productService.findByIdForAdmin(1);
    await productService.findRelated(1);
    await productService.findCategories();
    await productService.findAllCategoriesForAdmin();
    await productService.findBrands();
    await productService.findCategoryGroups();
    await productService.findAllCategoryGroupsForAdmin();

    expect(apiFetch).toHaveBeenCalledWith("/products/1", {
      method: "GET",
      auth: false,
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/admin/1", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/1/related", {
      method: "GET",
      auth: false,
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/categories", {
      method: "GET",
      auth: false,
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/admin/categories", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/brands", {
      method: "GET",
      auth: false,
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/category-groups", {
      method: "GET",
      auth: false,
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/admin/category-groups", {
      method: "GET",
    });
  });

  it("cria, atualiza, ativa, desativa e remove produto", async () => {
    const request = {
      name: "Notebook",
      description: "Produto teste",
      categoryGroup: "Computadores e Mobile",
      category: "Notebook",
      brand: "PointClick",
      model: "PC",
      price: 1000,
      stockQuantity: 10,
      imageUrl: null,
      active: true,
    };

    vi.mocked(apiFetch).mockResolvedValue({ id: 1 });

    await productService.create(request);
    await productService.update(1, request);
    await productService.activate(1);
    await productService.deactivate(1);
    await productService.delete(1);

    expect(apiFetch).toHaveBeenCalledWith("/products", {
      method: "POST",
      body: request,
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/1", {
      method: "PUT",
      body: request,
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/1/activate", {
      method: "PATCH",
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/1/deactivate", {
      method: "PATCH",
    });
    expect(apiFetch).toHaveBeenCalledWith("/products/1", {
      method: "DELETE",
    });
  });
});
