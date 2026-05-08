import type { AuthenticatedUserResponse } from "@/types/auth";
import type { UserResponse } from "@/types/user";

export const authenticatedCustomerFixture: AuthenticatedUserResponse = {
  id: 1,
  fullName: "Cliente PointClick",
  email: "cliente@pointclick.com",
  role: "CUSTOMER",
};

export const authenticatedAdminFixture: AuthenticatedUserResponse = {
  id: 2,
  fullName: "Admin PointClick",
  email: "admin@pointclick.com",
  role: "ADMIN",
};

export const userProfileFixture: UserResponse = {
  id: 1,
  fullName: "Cliente PointClick",
  email: "cliente@pointclick.com",
  cpf: "12345678909",
  phone: "19999999999",
  avatarUrl: null,
  role: "CUSTOMER",
  active: true,
  address: {
    id: 1,
    cep: "13480000",
    street: "Rua Teste",
    number: "123",
    complement: null,
    city: "Limeira",
    state: "SP",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  profileCompleteForCheckout: true,
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

export function makeUserProfileFixture(
  overrides: Partial<UserResponse> = {}
): UserResponse {
  return {
    ...userProfileFixture,
    ...overrides,
  };
}
