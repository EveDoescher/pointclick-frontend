"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AuthenticatedUserResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";
import type { CreateUserRequest, UserResponse } from "@/types/user";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { getStoredUser } from "@/services/api";

type AuthContextValue = {
  user: AuthenticatedUserResponse | null;
  profile: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  loading: boolean;
  login: (request: LoginRequest) => Promise<LoginResponse>;
  register: (request: CreateUserRequest) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<UserResponse | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthenticatedUserResponse | null>(null);
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (): Promise<UserResponse | null> => {
    try {
      const response = await userService.findMe();
      setProfile(response);
      return response;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const authenticatedUser = await authService.me();
      setUser(authenticatedUser);
      await refreshProfile();
    } catch {
      authService.clearSession();
      setUser(null);
      setProfile(null);
    }
  }, [refreshProfile]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      setLoading(true);

      const storedUser = getStoredUser();

      if (!storedUser) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }

        return;
      }

      if (mounted) {
        setUser(storedUser);
      }

      try {
        const authenticatedUser = await authService.me();

        if (!mounted) return;

        setUser(authenticatedUser);

        const fullProfile = await userService.findMe();

        if (!mounted) return;

        setProfile(fullProfile);
      } catch {
        authService.clearSession();

        if (!mounted) return;

        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();

    function handleAuthChanged() {
      const updatedUser = getStoredUser();
      setUser(updatedUser);
    }

    window.addEventListener("pointclick-auth-changed", handleAuthChanged);

    return () => {
      mounted = false;
      window.removeEventListener("pointclick-auth-changed", handleAuthChanged);
    };
  }, []);

  const login = useCallback(
    async (request: LoginRequest): Promise<LoginResponse> => {
      const response = await authService.login(request);

      setUser(response.user);

      try {
        const fullProfile = await userService.findMe();
        setProfile(fullProfile);
      } catch {
        setProfile(null);
      }

      return response;
    },
    []
  );

  const register = useCallback(
    async (request: CreateUserRequest): Promise<UserResponse> => {
      return userService.create(request);
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();

    setUser(null);
    setProfile(null);

    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
      isCustomer: user?.role === "CUSTOMER",
      loading,
      login,
      register,
      logout,
      refreshUser,
      refreshProfile,
    }),
    [user, profile, loading, login, register, logout, refreshUser, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}