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
import { userService } from "../userService";

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria usuário sem autenticação", async () => {
    const request = {
      fullName: "Cliente Teste",
      email: "cliente@teste.com",
      password: "123456",
    };

    vi.mocked(apiFetch).mockResolvedValueOnce({ id: 1 });

    await userService.create(request);

    expect(apiFetch).toHaveBeenCalledWith("/users", {
      method: "POST",
      body: request,
      auth: false,
    });
  });

  it("busca e atualiza dados do usuário logado", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: 1 });

    await userService.findMe();
    await userService.updateMyProfile({
      fullName: "Cliente",
      cpf: "12345678909",
      phone: null,
    });
    await userService.updateMyAddress({
      cep: "13480000",
      street: "Rua Teste",
      number: "123",
      complement: null,
      city: "Limeira",
      state: "SP",
    });

    expect(apiFetch).toHaveBeenCalledWith("/users/me", { method: "GET" });
    expect(apiFetch).toHaveBeenCalledWith("/users/me/profile", {
      method: "PATCH",
      body: {
        fullName: "Cliente",
        cpf: "12345678909",
        phone: null,
      },
    });
    expect(apiFetch).toHaveBeenCalledWith("/users/me/address", {
      method: "PUT",
      body: {
        cep: "13480000",
        street: "Rua Teste",
        number: "123",
        complement: null,
        city: "Limeira",
        state: "SP",
      },
    });
  });

  it("envia avatar usando FormData", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    vi.mocked(apiFetch).mockResolvedValueOnce({ id: 1 });

    await userService.uploadAvatar(file);

    expect(apiFetch).toHaveBeenCalledWith(
      "/users/me/avatar",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });

  it("executa operações administrativas de usuário", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: 1 });

    await userService.findAllForAdmin({ active: true, role: "CUSTOMER" });
    await userService.findById(1);
    await userService.findByIdForAdmin(1);
    await userService.update(1, {
      fullName: "Cliente",
      email: "cliente@teste.com",
      cpf: "12345678909",
      phone: null,
      address: {
        cep: "13480000",
        street: "Rua Teste",
        number: "123",
        complement: null,
        city: "Limeira",
        state: "SP",
      },
    });
    await userService.delete(1);
    await userService.reactivate(1);
    await userService.findOrdersByUserId(1);

    expect(apiFetch).toHaveBeenCalledWith("/users?active=true&role=CUSTOMER", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenCalledWith("/users/1", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenCalledWith("/users/admin/1", {
      method: "GET",
    });
    expect(apiFetch).toHaveBeenCalledWith("/users/1", {
      method: "PUT",
      body: expect.any(Object),
    });
    expect(apiFetch).toHaveBeenCalledWith("/users/1", {
      method: "DELETE",
    });
    expect(apiFetch).toHaveBeenCalledWith("/users/1/activate", {
      method: "PATCH",
    });
    expect(apiFetch).toHaveBeenCalledWith("/users/1/orders", {
      method: "GET",
    });
  });
});
