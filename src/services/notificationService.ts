import type { ApiCountResponse } from "@/types/api";
import type { NotificationResponse } from "@/types/notification";
import { apiFetch, buildQueryParams } from "./api";

export const notificationService = {
  async findMyNotifications(
    unreadOnly: boolean = false
  ): Promise<NotificationResponse[]> {
    const query = buildQueryParams({
      unreadOnly,
    });

    return apiFetch<NotificationResponse[]>(`/notifications${query}`, {
      method: "GET",
    });
  },

  async countUnreadNotifications(): Promise<number> {
    const response = await apiFetch<ApiCountResponse>(
      "/notifications/unread-count",
      {
        method: "GET",
      }
    );

    return response.count;
  },

  async markAsRead(notificationId: number): Promise<NotificationResponse> {
    return apiFetch<NotificationResponse>(
      `/notifications/${notificationId}/read`,
      {
        method: "PATCH",
      }
    );
  },

  async markAllAsRead(): Promise<void> {
    return apiFetch<void>("/notifications/read-all", {
      method: "PATCH",
    });
  },

  async delete(notificationId: number): Promise<void> {
    return apiFetch<void>(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  },
};