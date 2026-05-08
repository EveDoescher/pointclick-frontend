import type { AdminDashboardResponse } from "@/types/admin";
import { apiFetch } from "./api";

export const adminService = {
  async getDashboard(): Promise<AdminDashboardResponse> {
    return apiFetch<AdminDashboardResponse>("/admin/dashboard", {
      method: "GET",
    });
  },
};