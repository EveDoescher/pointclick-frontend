import type { UserRole } from "./user";

export type AuthenticatedUserResponse = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  type: "Bearer" | string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUserResponse;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type AuthUser = AuthenticatedUserResponse;

export type AuthTokens = {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};