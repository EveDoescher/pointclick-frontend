import type { OrderSummaryResponse } from "@/types/order";
import type {
  CreateUserRequest,
  UpdateAddressRequest,
  UpdateMyProfileRequest,
  UpdateUserRequest,
  UserResponse,
  UserRole,
} from "@/types/user";
import { apiFetch, buildQueryParams } from "./api";

type UserAdminFilters = {
  active?: boolean | null;
  role?: UserRole | null;
};

export const userService = {
  async create(request: CreateUserRequest): Promise<UserResponse> {
    return apiFetch<UserResponse>("/users", {
      method: "POST",
      body: request,
      auth: false,
    });
  },

  async findMe(): Promise<UserResponse> {
    return apiFetch<UserResponse>("/users/me", {
      method: "GET",
    });
  },

  async updateMyProfile(
    request: UpdateMyProfileRequest
  ): Promise<UserResponse> {
    return apiFetch<UserResponse>("/users/me/profile", {
      method: "PATCH",
      body: request,
    });
  },

  async updateMyAddress(
    request: UpdateAddressRequest
  ): Promise<UserResponse> {
    return apiFetch<UserResponse>("/users/me/address", {
      method: "PUT",
      body: request,
    });
  },

  async uploadAvatar(file: File): Promise<UserResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<UserResponse>("/users/me/avatar", {
      method: "POST",
      body: formData,
    });
  },

  async findAllForAdmin(
    filters: UserAdminFilters = {}
  ): Promise<UserResponse[]> {
    const query = buildQueryParams({
      active: filters.active,
      role: filters.role,
    });

    return apiFetch<UserResponse[]>(`/users${query}`, {
      method: "GET",
    });
  },

  async findById(id: number): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/users/${id}`, {
      method: "GET",
    });
  },

  async findByIdForAdmin(id: number): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/users/admin/${id}`, {
      method: "GET",
    });
  },

  async update(id: number, request: UpdateUserRequest): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/users/${id}`, {
      method: "PUT",
      body: request,
    });
  },

  async delete(id: number): Promise<void> {
    return apiFetch<void>(`/users/${id}`, {
      method: "DELETE",
    });
  },

  async reactivate(id: number): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/users/${id}/activate`, {
      method: "PATCH",
    });
  },

  async findOrdersByUserId(userId: number): Promise<OrderSummaryResponse[]> {
    return apiFetch<OrderSummaryResponse[]>(`/users/${userId}/orders`, {
      method: "GET",
    });
  },
};