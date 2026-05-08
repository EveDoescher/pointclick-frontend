"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CircleDot } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { NotificationResponse } from "@/types/notification";
import { NOTIFICATION_TYPE_LABELS } from "@/types/notification";
import { notificationService } from "@/services/notificationService";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatDateTime } from "@/utils/formatters";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}

function NotificationsContent() {
  const { showError } = useFeedbackModal();

  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadNotifications(currentUnreadOnly = unreadOnly) {
    setLoading(true);

    try {
      const response = await notificationService.findMyNotifications(
        currentUnreadOnly
      );

      setNotifications(response);
    } catch (error) {
      showError(error, "Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(unreadOnly);
  }, [unreadOnly]);

  async function handleMarkAsRead(notification: NotificationResponse) {
    if (notification.read) return;

    setActionLoading(true);

    try {
      const updated = await notificationService.markAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (error) {
      showError(error, "Erro ao marcar notificação");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkAllAsRead() {
    setActionLoading(true);

    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
          readAt: notification.readAt ?? new Date().toISOString(),
        }))
      );

    } catch (error) {
      showError(error, "Erro ao atualizar notificações");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(notificationId: number) {
    setActionLoading(true);

    try {
      await notificationService.delete(notificationId);

      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId)
      );

    } catch (error) {
      showError(error, "Erro ao remover notificação");
    } finally {
      setActionLoading(false);
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-stone-200 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Conta
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-rubik)] text-3xl font-semibold tracking-[-0.04em] text-stone-900 sm:text-4xl">
                Notificações
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                Pedidos e pagamentos. Use os filtros abaixo; marcar como lida é
                opcional e não bloqueia a navegação.
              </p>
            </div>
            <p className="text-sm text-stone-600">
              <span className="font-medium text-stone-900">{unreadCount}</span>{" "}
              não lidas
            </p>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              !unreadOnly
                ? "border-stone-400 bg-[#ebe5d7] text-stone-900 shadow-sm"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            }`}
          >
            Todas
          </button>

          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              unreadOnly
                ? "border-stone-400 bg-[#ebe5d7] text-stone-900 shadow-sm"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            }`}
          >
            Não lidas
          </button>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading || unreadCount === 0}
            className="pc-btn pc-btn-ghost w-full text-sm sm:ml-auto sm:w-auto disabled:cursor-not-allowed disabled:opacity-40"
          >
            Marcar todas como lidas
          </button>
        </div>

        {loading ? (
          <div className="mt-10 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[2rem] bg-stone-200/90"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-[0_18px_34px_rgba(28,25,23,0.06)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-stone-100 text-stone-500">
              <Bell className="h-9 w-9" aria-hidden="true" />
            </div>

            <h2 className="mt-7 font-[family-name:var(--font-rubik)] text-2xl font-semibold text-stone-900">
              Nenhuma notificação
            </h2>

            <p className="mt-3 text-stone-600">
              Quando houver novidades sobre pedidos ou favoritos, elas aparecerão
              aqui.
            </p>
          </section>
        ) : (
          <div className="mt-10 space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-xl border p-5 shadow-sm transition md:p-6 ${
                  notification.read
                    ? "border-stone-200 bg-white"
                    : "border-l-4 border-l-[var(--pc-purple)] border-stone-200 bg-white"
                }`}
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                          notification.read
                            ? "border-stone-200 bg-stone-50 text-stone-600"
                            : "border-stone-200 bg-[#f4f1eb] text-stone-800"
                        }`}
                      >
                        {notification.read ? "Lida" : "Nova"}
                      </span>

                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-700">
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </span>
                    </div>

                    <h2 className="mt-4 flex items-center gap-2 font-[family-name:var(--font-rubik)] text-xl font-semibold text-stone-900">
                      {!notification.read && (
                        <CircleDot className="h-4 w-4 shrink-0 text-[var(--pc-purple)]" aria-hidden="true" />
                      )}
                      {notification.title}
                    </h2>

                    <p className="mt-2 leading-7 text-stone-600">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-sm font-medium text-stone-500">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                    {notification.linkUrl && (
                      <Link
                        href={notification.linkUrl}
                        onClick={() => handleMarkAsRead(notification)}
                        className="pc-btn pc-btn-accent px-5 py-2.5 text-center text-sm"
                      >
                        Abrir
                      </Link>
                    )}

                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification)}
                        disabled={actionLoading}
                        className="pc-btn pc-btn-secondary px-5 py-2.5 text-sm disabled:opacity-50"
                      >
                        Marcar lida
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(notification.id)}
                      disabled={actionLoading}
                      className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}