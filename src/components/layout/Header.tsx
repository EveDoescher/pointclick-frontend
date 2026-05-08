"use client";

import { FormEvent, Suspense, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Cable,
  ChevronDown,
  Headphones,
  Heart,
  Home,
  Laptop,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Mouse,
  Package,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TicketPercent,
  UserRound,
  X,
  type LucideProps,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { CartToast } from "@/components/cart/CartToast";
import { buildPublicFileUrl } from "@/services/api";
import { getInitials } from "@/utils/formatters";

type IconType = ComponentType<LucideProps>;

type HeaderLink = {
  href: string;
  label: string;
  icon: IconType;
};

function categoryGroupHref(categoryGroup: string) {
  return `/produtos?categoryGroup=${encodeURIComponent(categoryGroup)}`;
}

const storeLinks: HeaderLink[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/produtos?sort=newest", label: "Novidades", icon: Sparkles },
  {
    href: categoryGroupHref("Computadores e Mobile"),
    label: "Notebooks",
    icon: Laptop,
  },
  { href: categoryGroupHref("Periféricos"), label: "Periféricos", icon: Mouse },
  { href: categoryGroupHref("Vídeo"), label: "Monitores", icon: Monitor },
  { href: categoryGroupHref("Áudio"), label: "Áudio", icon: Headphones },
  { href: categoryGroupHref("Acessórios"), label: "Acessórios", icon: Cable },
];

const customerLinks: HeaderLink[] = [
  { href: "/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/minha-conta", label: "Minha conta", icon: UserRound },
];

const adminLinks: HeaderLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/usuarios", label: "Usuários", icon: UserRound },
  { href: "/admin/cupons", label: "Cupons", icon: TicketPercent },
];

export function Header() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderContent />
    </Suspense>
  );
}

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 lg:px-8">
        <div />

        <Link
          href="/"
          className="justify-self-center text-center"
          aria-label="Ir para a página inicial da PointClick"
        >
          <span className="block text-[1.05rem] font-semibold tracking-[0.28em] text-stone-950">
            POINTCLICK
          </span>
        </Link>

        <div />
      </div>

      <div className="hidden border-t border-stone-100 bg-[#fbfaf7]/80 xl:block">
        <nav className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-8 py-3">
          {storeLinks.map((link) => (
            <StoreNavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={false}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, profile, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") ?? "",
  );

  const accountName = profile?.fullName ?? user?.fullName;
  const accountEmail = profile?.email ?? user?.email;
  const accountAvatarUrl = buildPublicFileUrl(profile?.avatarUrl ?? null);
  const initials = getInitials(accountName);

  async function handleLogout() {
    setAccountOpen(false);
    setMobileOpen(false);
    await logout();
  }

  function closeMenus() {
    setMobileOpen(false);
    setAccountOpen(false);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedSearch = searchTerm.trim();
    closeMenus();

    if (!normalizedSearch) {
      router.push("/produtos");
      return;
    }

    router.push(`/produtos?search=${encodeURIComponent(normalizedSearch)}`);
  }

  function isStoreLinkActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (pathname !== "/produtos") {
      return false;
    }

    const url = new URL(href, "http://pointclick.local");
    const linkCategoryGroup = url.searchParams.get("categoryGroup");
    const linkCategory = url.searchParams.get("category");
    const linkSort = url.searchParams.get("sort");

    if (linkCategoryGroup) {
      return searchParams.get("categoryGroup") === linkCategoryGroup;
    }

    if (linkCategory) {
      return searchParams.get("category") === linkCategory;
    }

    if (linkSort) {
      return (
        searchParams.get("sort") === linkSort &&
        !searchParams.get("categoryGroup") &&
        !searchParams.get("category")
      );
    }

    return false;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-900 transition hover:border-stone-500 xl:hidden"
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <form
              onSubmit={handleSearchSubmit}
              className="hidden h-10 w-full max-w-[320px] items-center gap-2 rounded-full border border-stone-300 bg-white px-4 transition focus-within:border-[#d8c28f] md:flex"
            >
              <Search
                className="h-4 w-4 shrink-0 text-stone-500"
                aria-hidden="true"
              />

              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar produtos"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-900 outline-none placeholder:text-stone-500"
                aria-label="Buscar produtos"
              />

              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </form>
          </div>

          <Link
            href="/"
            onClick={closeMenus}
            className="justify-self-center text-center"
            aria-label="Ir para a página inicial da PointClick"
          >
            <span className="block text-[1.05rem] font-semibold tracking-[0.28em] text-stone-950">
              POINTCLICK
            </span>
          </Link>

          <div className="flex items-center justify-end gap-2">
            <NotificationBell />

            <Link
              href="/carrinho"
              onClick={closeMenus}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-900 transition hover:border-stone-500"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-950 px-1.5 text-[10px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((current) => !current)}
                  className="flex h-10 items-center gap-2 rounded-full border border-stone-300 bg-white pl-1.5 pr-3 transition hover:border-stone-500"
                  aria-expanded={accountOpen}
                  aria-label="Abrir menu da conta"
                >
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-stone-100 text-xs font-semibold text-stone-950">
                    {accountAvatarUrl ? (
                      <img
                        src={accountAvatarUrl}
                        alt={accountName ?? "Usuário"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>

                  <span className="hidden max-w-32 truncate text-sm font-semibold text-stone-700 lg:block">
                    {accountName}
                  </span>

                  <ChevronDown
                    className="h-4 w-4 text-stone-500"
                    aria-hidden="true"
                  />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
                    <div className="border-b border-stone-200 p-4">
                      <p className="truncate text-sm font-semibold text-stone-950">
                        {accountName}
                      </p>

                      <p className="mt-1 truncate text-xs font-medium text-stone-500">
                        {accountEmail}
                      </p>

                      {isAdmin && (
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#d8c28f] bg-[#f4ead0] px-3 py-1 text-xs font-semibold text-[#8f6f2e]">
                          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="p-2">
                      {customerLinks.map((link) => (
                        <AccountLink
                          key={link.href}
                          href={link.href}
                          label={link.label}
                          icon={link.icon}
                          onClick={() => setAccountOpen(false)}
                        />
                      ))}

                      {isAdmin && (
                        <>
                          <div className="my-2 h-px bg-stone-200" />

                          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                            Administração
                          </p>

                          {adminLinks.map((link) => (
                            <AccountLink
                              key={link.href}
                              href={link.href}
                              label={link.label}
                              icon={link.icon}
                              onClick={() => setAccountOpen(false)}
                            />
                          ))}
                        </>
                      )}

                      <div className="my-2 h-px bg-stone-200" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--pc-danger)] transition hover:bg-[var(--pc-danger-soft)]"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
                >
                  Entrar
                </Link>

                <Link
                  href="/cadastro"
                  onClick={closeMenus}
                  className="rounded-full bg-[#8f6f2e] px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-[#76591f]"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="hidden border-t border-stone-100 bg-[#fbfaf7]/80 xl:block">
          <nav className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-8 py-3">
            {storeLinks.map((link) => (
              <StoreNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isStoreLinkActive(link.href)}
                onClick={closeMenus}
              />
            ))}
          </nav>
        </div>

        {mobileOpen && (
          <div className="border-t border-stone-200 bg-[#f8f7f3] px-4 py-4 xl:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-2">
              <form
                onSubmit={handleSearchSubmit}
                className="mb-3 flex h-11 items-center gap-2 rounded-full border border-stone-300 bg-white px-4"
              >
                <Search
                  className="h-4 w-4 shrink-0 text-stone-500"
                  aria-hidden="true"
                />

                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar produtos"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-900 outline-none placeholder:text-stone-500"
                  aria-label="Buscar produtos"
                />
              </form>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                  Loja
                </p>

                {storeLinks.map((link) => (
                  <MobileLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </div>

              {isAuthenticated && (
                <div className="mt-3 rounded-[1.5rem] border border-stone-200 bg-white p-2">
                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                    Conta
                  </p>

                  {customerLinks.map((link) => (
                    <MobileLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="mt-3 rounded-[1.5rem] border border-[#d8c28f] bg-[#f4ead0]/60 p-2">
                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8f6f2e]">
                    Administração
                  </p>

                  {adminLinks.map((link) => (
                    <MobileLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 border-t border-stone-200 pt-3">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-[var(--pc-danger)] transition hover:bg-[var(--pc-danger-soft)]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sair
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-full border border-stone-300 bg-white px-4 py-3 text-center text-sm font-bold text-stone-700"
                    >
                      Entrar
                    </Link>

                    <Link
                      href="/cadastro"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-full bg-[#8f6f2e] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#76591f]"
                    >
                      Criar conta
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <CartToast />
    </>
  );
}

function StoreNavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-semibold transition ${
        active ? "text-stone-950" : "text-stone-700 hover:text-stone-950"
      }`}
    >
      {label}
    </Link>
  );
}

function AccountLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: IconType;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-[#fbfaf7] hover:text-stone-950"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: IconType;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#fbfaf7] hover:text-stone-950"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
