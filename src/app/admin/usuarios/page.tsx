"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { UserResponse, UserRole } from "@/types/user";
import { userService } from "@/services/userService";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import {
  formatCpf,
  formatDateTime,
  formatPhone,
  getInitials,
} from "@/utils/formatters";

type UserToToggle = {
  user: UserResponse;
  action: "DEACTIVATE" | "REACTIVATE";
};

const roleOptions: { value: UserRole | ""; label: string }[] = [
  { value: "", label: "Todos os perfis" },
  { value: "CUSTOMER", label: "Clientes" },
  { value: "ADMIN", label: "Administradores" },
];

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Cliente",
  ADMIN: "Admin",
};

export default function AdminUsersPage() {
  return (
    <AdminRoute>
      <AdminUsersContent />
    </AdminRoute>
  );
}

function AdminUsersContent() {
  const { showError } = useFeedbackModal();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");

  const [userToToggle, setUserToToggle] = useState<UserToToggle | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return users;

    return users.filter((user) => {
      return [
        String(user.id),
        user.fullName,
        user.email,
        user.cpf ?? "",
        user.phone ?? "",
        user.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [users, search]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.active).length,
      inactive: users.filter((user) => !user.active).length,
      customers: users.filter((user) => user.role === "CUSTOMER").length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      checkoutComplete: users.filter((user) => user.profileCompleteForCheckout)
        .length,
    };
  }, [users]);

  useEffect(() => {
    loadUsers();
  }, [activeFilter, roleFilter]);

  async function loadUsers() {
    setLoading(true);

    try {
      const response = await userService.findAllForAdmin({
        active: activeFilter === "" ? null : activeFilter === "true",
        role: roleFilter === "" ? null : roleFilter,
      });

      setUsers(response);
    } catch (error) {
      showError(error, "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    await loadUsers();
  }

  async function handleConfirmToggle() {
    if (!userToToggle) return;

    setActionLoading(true);

    try {
      if (userToToggle.action === "DEACTIVATE") {
        await userService.delete(userToToggle.user.id);
      } else {
        await userService.reactivate(userToToggle.user.id);
      }

      setUserToToggle(null);
      await loadUsers();
    } catch (error) {
      showError(error, "Erro ao alterar status do usuário");
    } finally {
      setActionLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setActiveFilter("");
    setRoleFilter("");
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao painel administrativo
        </Link>
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.06)]">
          <div className="grid gap-0 xl:grid-cols-[1fr_390px]">
            <div className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                Admin • Usuários
              </p>

              <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950 md:text-5xl">
                    Gestão de usuários
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                    Consulte clientes e administradores, acompanhe status de
                    conta, dados de contato e informações necessárias para o
                    checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  Atualizar
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard label="Total" value={stats.total} icon={Users} />
                <StatCard
                  label="Ativos"
                  value={stats.active}
                  icon={CheckCircle2}
                />
                <StatCard
                  label="Inativos"
                  value={stats.inactive}
                  icon={XCircle}
                  tone={stats.inactive > 0 ? "muted" : "neutral"}
                />
                <StatCard
                  label="Clientes"
                  value={stats.customers}
                  icon={UserRound}
                />
                <StatCard label="Admins" value={stats.admins} icon={Crown} />
                <StatCard
                  label="Checkout ok"
                  value={stats.checkoutComplete}
                  icon={PackageCheck}
                  tone="premium"
                />
              </div>
            </div>

            <aside className="border-t border-stone-200 bg-[#fbfaf7] p-6 xl:border-l xl:border-t-0 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Operação
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Contas e acesso
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                Admins controlam o painel. Clientes usam a conta para comprar,
                salvar dados de entrega e acompanhar pedidos.
              </p>

              <div className="mt-6 space-y-3">
                <OperationRow
                  icon={ShieldCheck}
                  label="Administradores"
                  value={stats.admins}
                />
                <OperationRow
                  icon={UserRound}
                  label="Clientes ativos"
                  value={users.filter((user) => user.active && user.role === "CUSTOMER").length}
                />
                <OperationRow
                  icon={PackageCheck}
                  label="Prontos para checkout"
                  value={stats.checkoutComplete}
                />
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_20px_54px_rgba(41,37,36,0.04)] md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-[#fbfaf7] text-[#8f6f2e]">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-semibold text-stone-950">
                Filtros da listagem
              </p>
              <p className="text-sm text-stone-500">
                Busque por nome, e-mail, CPF, telefone, ID ou perfil.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_230px_230px_auto]">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar usuário"
                className="h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] pl-11 pr-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
              />
            </label>

            <select
              value={activeFilter}
              onChange={(event) =>
                setActiveFilter(event.target.value as "" | "true" | "false")
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              <option value="">Todos os status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as UserRole | "")
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              {roleOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-12 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] hover:text-stone-950"
            >
              Limpar
            </button>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Usuários cadastrados
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Lista administrativa
              </h2>
            </div>

            <p className="text-sm text-stone-500">
              {loading
                ? "Carregando usuários..."
                : `${filteredUsers.length} usuário(s) nesta visualização`}
            </p>
          </div>

          {loading ? (
            <UsersSkeleton />
          ) : filteredUsers.length === 0 ? (
            <EmptyUsers onClear={clearFilters} />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onToggle={() =>
                    setUserToToggle({
                      user,
                      action: user.active ? "DEACTIVATE" : "REACTIVATE",
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>

        <ConfirmModal
          open={Boolean(userToToggle)}
          title={
            userToToggle?.action === "DEACTIVATE"
              ? "Desativar usuário?"
              : "Reativar usuário?"
          }
          message={
            userToToggle?.action === "DEACTIVATE"
              ? "A conta ficará inativa e o usuário não poderá acessar a aplicação até ser reativado."
              : "A conta voltará a ficar ativa e o usuário poderá acessar a aplicação novamente."
          }
          confirmLabel={
            userToToggle?.action === "DEACTIVATE" ? "Desativar" : "Reativar"
          }
          danger={userToToggle?.action === "DEACTIVATE"}
          loading={actionLoading}
          onClose={() => {
            if (!actionLoading) setUserToToggle(null);
          }}
          onConfirm={handleConfirmToggle}
        />
      </div>
    </main>
  );
}

function UserCard({
  user,
  onToggle,
}: {
  user: UserResponse;
  onToggle: () => void;
}) {
  const initials = getInitials(user.fullName);
  const roleTone = getRoleTone(user.role);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_18px_48px_rgba(41,37,36,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_58px_rgba(41,37,36,0.08)]">
      <div className="border-b border-stone-200 bg-[#fbfaf7] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-[#f1efea] text-sm font-bold text-[#8f6f2e] ring-1 ring-stone-200">
              {initials}
            </div>

            <div className="min-w-0">
              <h3 className="line-clamp-1 text-xl font-semibold tracking-[-0.025em] text-stone-950">
                {user.fullName}
              </h3>

              <p className="mt-1 line-clamp-1 text-sm font-medium text-stone-500">
                {user.email}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              user.active
                ? "bg-[var(--pc-green-soft)] text-[var(--pc-green)]"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            {user.active ? "Ativo" : "Inativo"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleTone}`}
          >
            {user.role === "ADMIN" ? (
              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {roleLabels[user.role]}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              user.profileCompleteForCheckout
                ? "bg-[var(--pc-green-soft)] text-[var(--pc-green)]"
                : "bg-[#f4ead0] text-[#8f6f2e]"
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {user.profileCompleteForCheckout
              ? "Checkout completo"
              : "Checkout incompleto"}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="ID" value={`#${user.id}`} />
          <InfoTile label="CPF" value={user.cpf ? formatCpf(user.cpf) : "—"} />
          <InfoTile
            label="Telefone"
            value={user.phone ? formatPhone(user.phone) : "—"}
          />
          <InfoTile label="Perfil" value={roleLabels[user.role]} />
        </div>

        <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#8f6f2e] ring-1 ring-stone-200">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-950">
                Endereço
              </p>

              {user.address ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
                  {user.address.street}, {user.address.number}
                  {user.address.complement
                    ? ` - ${user.address.complement}`
                    : ""}
                  , {user.address.city}/{user.address.state} -{" "}
                  {user.address.cep}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Endereço ainda não cadastrado.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLine
            icon={Clock}
            label="Criado em"
            value={formatDateTime(user.createdAt)}
          />
          <DetailLine
            icon={Clock}
            label="Atualizado em"
            value={formatDateTime(user.updatedAt)}
          />
        </div>

        <div className="grid gap-3 border-t border-stone-200 pt-5 sm:grid-cols-2">
          <Link
            href={`/admin/pedidos?search=${encodeURIComponent(user.email)}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7]"
          >
            Ver pedidos
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
              user.active
                ? "border border-[var(--pc-danger)]/25 bg-white text-[var(--pc-danger)] hover:bg-[var(--pc-danger-soft)]"
                : "bg-[var(--pc-green)] text-white hover:bg-[var(--pc-green-hover)]"
            }`}
          >
            {user.active ? (
              <XCircle className="h-4 w-4" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            {user.active ? "Desativar" : "Reativar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neutral" | "muted" | "premium";
}) {
  const toneClass = {
    neutral: "text-stone-500 bg-[#fbfaf7]",
    muted: "text-stone-500 bg-stone-100",
    premium: "text-[#8f6f2e] bg-[#f4ead0]",
  }[tone];

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          {label}
        </p>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
        {value}
      </p>
    </div>
  );
}

function OperationRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-stone-200 bg-white px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-semibold text-stone-600">
        <Icon className="h-4 w-4 text-[#8f6f2e]" aria-hidden="true" />
        {label}
      </span>

      <span className="text-base font-semibold text-stone-950">{value}</span>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-stone-200 bg-[#fbfaf7] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-[1.25rem] border border-stone-200 bg-white p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fbfaf7] text-stone-500 ring-1 ring-stone-200">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-stone-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyUsers({ onClear }: { onClear: () => void }) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
      <Users className="mx-auto h-10 w-10 text-stone-400" aria-hidden="true" />

      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
        Nenhum usuário encontrado
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
        Ajuste os filtros ou limpe a busca para visualizar outros usuários.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-7 inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7]"
      >
        Limpar filtros
      </button>
    </section>
  );
}

function UsersSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[430px] animate-pulse rounded-[2rem] bg-stone-200"
        />
      ))}
    </div>
  );
}

function getRoleTone(role: UserRole) {
  if (role === "ADMIN") {
    return "bg-[#f4ead0] text-[#8f6f2e]";
  }

  return "bg-stone-100 text-stone-600";
}