"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CircleDot,
  Inbox,
  Loader2,
  MailOpen,
} from "lucide-react";
import type { NotificationResponse } from "@/types/notification";
import { notificationService } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatDateTime } from "@/utils/formatters";

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { showError } = useFeedbackModal();

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  async function loadUnreadCount() {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationService.countUnreadNotifications();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }

  async function loadNotifications() {
    if (!isAuthenticated) return;

    setLoading(true);

    try {
      const response = await notificationService.findMyNotifications(false);
      setNotifications(response.slice(0, 6));
      await loadUnreadCount();
    } catch (error) {
      showError(error, "Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  }

  async function handleMarkAsRead(notification: NotificationResponse) {
    if (notification.read) return;

    try {
      const updated = await notificationService.markAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );

      await loadUnreadCount();
    } catch (error) {
      showError(error, "Erro ao atualizar notificação");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
          readAt: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      showError(error, "Erro ao atualizar notificações");
    }
  }

  useEffect(() => {
    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pc-border)] bg-white text-[var(--pc-text)] transition hover:border-[#cfc8bc] hover:bg-[#fbfaf7]"
        aria-label="Abrir notificações"
        aria-expanded={open}
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--pc-green)] px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-[var(--pc-border)] bg-white shadow-[0_20px_44px_rgba(46,39,31,0.14)]">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--pc-border)] bg-white p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pc-purple)]">
                Notificações
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--pc-border)] bg-white px-3 text-xs font-semibold text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#fbfaf7]"
              >
                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                Lidas
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto bg-white">
            {loading ? (
              <div className="flex items-center gap-3 p-5 text-sm font-medium text-[var(--pc-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Carregando notificações...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1efea] text-[var(--pc-text-muted)]">
                  <Inbox className="h-6 w-6" aria-hidden="true" />
                </div>

                <p className="mt-4 text-sm font-semibold text-[var(--pc-text)]">
                  Nenhuma notificação
                </p>

                <p className="mt-1 max-w-xs text-sm leading-6 text-[var(--pc-text-muted)]">
                  Novidades sobre pedidos, estoque e promoções aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--pc-border)]">
                {notifications.map((notification) => {
                  const content = (
                    <div
                      className={`p-4 transition ${
                        notification.read
                          ? "bg-white hover:bg-[#fbfaf7]"
                          : "bg-[#fbfaf7] hover:bg-[#f5efe3]"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            notification.read
                              ? "bg-[#f1efea] text-[var(--pc-text-muted)]"
                              : "bg-[var(--pc-purple-soft)] text-[var(--pc-purple)]"
                          }`}
                        >
                          {notification.read ? (
                            <MailOpen className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <CircleDot className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-1 text-sm font-semibold text-[var(--pc-text)]">
                              {notification.title}
                            </p>

                            {!notification.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--pc-purple)]" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--pc-text-soft)]">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-xs font-medium text-[var(--pc-text-muted)]">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );

                  if (notification.linkUrl) {
                    return (
                      <Link
                        key={notification.id}
                        href={notification.linkUrl}
                        onClick={() => {
                          handleMarkAsRead(notification);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleMarkAsRead(notification)}
                      className="block w-full text-left"
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--pc-border)] bg-white p-3">
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center justify-center rounded-full border border-[var(--pc-border)] bg-white px-4 text-sm font-semibold text-[var(--pc-text)] transition hover:border-[var(--pc-border-strong)] hover:bg-[#fbfaf7]"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}