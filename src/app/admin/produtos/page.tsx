"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ImageIcon,
  Loader2,
  PackageSearch,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  SlidersHorizontal,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type {
  CreateProductRequest,
  ProductFilters,
  ProductResponse,
  ProductSort,
} from "@/types/product";
import { productService } from "@/services/productService";
import { uploadService } from "@/services/uploadService";
import { buildPublicFileUrl } from "@/services/api";
import { useFeedbackModal } from "@/contexts/FeedbackModalContext";
import { formatCurrency } from "@/utils/formatters";

type ProductFormState = {
  name: string;
  description: string;
  categoryGroup: string;
  category: string;
  brand: string;
  model: string;
  price: string;
  stockQuantity: string;
  imageUrl: string;
  active: boolean;
};

const initialForm: ProductFormState = {
  name: "",
  description: "",
  categoryGroup: "",
  category: "",
  brand: "",
  model: "",
  price: "",
  stockQuantity: "",
  imageUrl: "",
  active: true,
};

const ADMIN_LOW_STOCK_THRESHOLD = 15;

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "name_asc", label: "Nome A-Z" },
];

export default function AdminProductsPage() {
  return (
    <AdminRoute>
      <AdminProductsContent />
    </AdminRoute>
  );
}

function AdminProductsContent() {
  const { showError } = useFeedbackModal();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(
    null,
  );
  const [productToToggle, setProductToToggle] =
    useState<ProductResponse | null>(null);

  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    categoryGroup: "",
    category: "",
    active: null,
    available: null,
    sort: "newest",
  });

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((product) => product.active).length;
    const inactive = products.filter((product) => !product.active).length;
    const outOfStock = products.filter((product) =>
      isProductOutOfStock(product),
    ).length;
    const lowStock = products.filter((product) =>
      isProductLowStock(product),
    ).length;

    return {
      total,
      active,
      inactive,
      outOfStock,
      lowStock,
    };
  }, [products]);

  const attentionProducts = useMemo(() => {
    return products
      .filter(
        (product) => isProductOutOfStock(product) || isProductLowStock(product),
      )
      .sort((a, b) => {
        if (isProductOutOfStock(a) && !isProductOutOfStock(b)) return -1;
        if (!isProductOutOfStock(a) && isProductOutOfStock(b)) return 1;

        return a.availableQuantity - b.availableQuantity;
      });
  }, [products]);

  const visibleAttentionProducts = attentionProducts.slice(0, 3);
  const hiddenAttentionCount = Math.max(attentionProducts.length - 3, 0);

  const previewUrl = filePreview || buildPublicFileUrl(form.imageUrl) || null;

  useEffect(() => {
    loadCategoryGroups();
    loadCategories();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadProducts(filters);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  async function loadProducts(currentFilters = filters) {
    setLoading(true);

    try {
      const response = await productService.findAllForAdmin(currentFilters);
      setProducts(response);
    } catch (error) {
      showError(error, "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategoryGroups() {
    try {
      const response = await productService.findAllCategoryGroupsForAdmin();
      setCategoryGroups(response);
    } catch {
      setCategoryGroups([]);
    }
  }

  async function loadCategories() {
    try {
      const response = await productService.findAllCategoriesForAdmin();
      setCategories(response);
    } catch {
      setCategories([]);
    }
  }

  function updateFilter<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateForm<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateForm() {
    setEditingProduct(null);
    setForm(initialForm);
    setSelectedFile(null);

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    setFilePreview(null);
    setFormOpen(true);
  }

  function openEditForm(product: ProductResponse) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      categoryGroup: product.categoryGroup ?? "",
      category: product.category,
      brand: product.brand,
      model: product.model ?? "",
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
      imageUrl: product.imageUrl ?? "",
      active: product.active,
    });
    setSelectedFile(null);

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    setFilePreview(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingProduct(null);
    setSelectedFile(null);

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    setFilePreview(null);
    setForm(initialForm);
  }

  function clearFilters() {
    setFilters({
      search: "",
      categoryGroup: "",
      category: "",
      active: null,
      available: null,
      sort: "newest",
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }

    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  }

  function buildRequest(imageUrl: string | null): CreateProductRequest {
    const price = Number(form.price);
    const stockQuantity = Number.parseInt(form.stockQuantity, 10);

    if (!form.name.trim()) {
      throw new Error("Informe o nome do produto.");
    }

    if (!form.brand.trim()) {
      throw new Error("Informe a marca do produto.");
    }

    if (!form.categoryGroup.trim()) {
      throw new Error("Informe o grupo da categoria do produto.");
    }

    if (!form.category.trim()) {
      throw new Error("Informe a categoria do produto.");
    }

    if (!form.description.trim()) {
      throw new Error("Informe a descrição do produto.");
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Informe um preço válido maior que zero.");
    }

    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      throw new Error("Informe uma quantidade de estoque válida.");
    }

    return {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryGroup: form.categoryGroup.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      model: form.model.trim() || null,
      price,
      stockQuantity,
      imageUrl,
      active: form.active,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);

    try {
      let imageUrl = form.imageUrl.trim() || null;

      if (selectedFile) {
        const upload = await uploadService.uploadProductImage(selectedFile);
        imageUrl = upload.url;
      }

      const request = buildRequest(imageUrl);

      if (editingProduct) {
        await productService.update(editingProduct.id, request);
      } else {
        await productService.create(request);
      }

      closeForm();
      await loadProducts(filters);
      await loadCategoryGroups();
      await loadCategories();
    } catch (error) {
      showError(
        error,
        editingProduct
          ? "Erro ao atualizar produto"
          : "Erro ao cadastrar produto",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!productToToggle) return;

    setSaving(true);

    try {
      if (productToToggle.active) {
        await productService.deactivate(productToToggle.id);
      } else {
        await productService.activate(productToToggle.id);
      }

      setProductToToggle(null);
      await loadProducts(filters);
    } catch (error) {
      showError(error, "Erro ao alterar status do produto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f3] px-4 py-8 lg:px-8 lg:py-10">
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
                Admin • Produtos
              </p>

              <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950 md:text-5xl">
                    Estoque e catálogo
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                    Cadastre produtos, ajuste preços, acompanhe disponibilidade
                    e controle o que aparece na vitrine.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Novo produto
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Total" value={stats.total} icon={Boxes} />
                <StatCard
                  label="Ativos"
                  value={stats.active}
                  icon={CheckCircle2}
                />
                <StatCard
                  label="Inativos"
                  value={stats.inactive}
                  icon={Archive}
                />
                <StatCard
                  label="Sem estoque"
                  value={stats.outOfStock}
                  icon={PackageSearch}
                  tone={stats.outOfStock > 0 ? "danger" : "neutral"}
                />
                <StatCard
                  label="Baixo estoque"
                  value={stats.lowStock}
                  icon={AlertTriangle}
                  tone={stats.lowStock > 0 ? "warning" : "neutral"}
                />
              </div>
            </div>

            <aside className="border-t border-stone-200 bg-[#fbfaf7] p-6 xl:border-l xl:border-t-0 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Estoque
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Produtos que exigem atenção
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                Resumo dos itens sem estoque ou próximos de acabar.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <StockSummaryCard
                  label="Sem estoque"
                  value={stats.outOfStock}
                  tone="danger"
                />

                <StockSummaryCard
                  label="Baixo estoque"
                  value={stats.lowStock}
                  tone="warning"
                />
              </div>

              <div className="mt-5 space-y-3">
                {attentionProducts.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pc-green-soft)] text-[var(--pc-green)]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          Estoque sob controle
                        </p>
                        <p className="mt-1 text-sm leading-6 text-stone-500">
                          Nenhum produto em situação crítica nesta visualização.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {visibleAttentionProducts.map((product) => (
                      <StockAlertItem
                        key={product.id}
                        product={product}
                        type={isProductOutOfStock(product) ? "out" : "low"}
                      />
                    ))}

                    {hiddenAttentionCount > 0 && (
                      <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
                        <p className="text-sm font-semibold text-stone-950">
                          + {hiddenAttentionCount} produto(s) exigem atenção
                        </p>

                        <p className="mt-1 text-sm leading-6 text-stone-500">
                          Use os filtros da listagem para revisar todos sem
                          poluir este painel.
                        </p>
                      </div>
                    )}
                  </>
                )}
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
                Refine por busca, grupo, categoria, status e ordenação.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.35fr_.75fr_.75fr_.65fr_.7fr_.75fr]">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />

              <input
                value={filters.search ?? ""}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Buscar produto, descrição ou marca"
                className="h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] pl-11 pr-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
              />
            </label>

            <select
              value={filters.categoryGroup ?? ""}
              onChange={(event) =>
                updateFilter("categoryGroup", event.target.value)
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              <option value="">Grupo</option>
              {categoryGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              value={filters.category ?? ""}
              onChange={(event) => updateFilter("category", event.target.value)}
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              <option value="">Categoria</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={
                filters.active === null || filters.active === undefined
                  ? ""
                  : String(filters.active)
              }
              onChange={(event) => {
                const value = event.target.value;
                updateFilter("active", value === "" ? null : value === "true");
              }}
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              <option value="">Status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>

            <select
              value={
                filters.available === null || filters.available === undefined
                  ? ""
                  : String(filters.available)
              }
              onChange={(event) => {
                const value = event.target.value;
                updateFilter(
                  "available",
                  value === "" ? null : value === "true",
                );
              }}
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              <option value="">Estoque</option>
              <option value="true">Disponíveis</option>
              <option value="false">Todos</option>
            </select>

            <select
              value={filters.sort ?? "newest"}
              onChange={(event) =>
                updateFilter("sort", event.target.value as ProductSort)
              }
              className="h-12 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none transition hover:border-stone-300 focus:border-[#d8c28f]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] hover:text-stone-950"
            >
              Limpar filtros
            </button>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
                Produtos cadastrados
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                Lista administrativa
              </h2>
            </div>

            <p className="text-sm text-stone-500">
              {loading
                ? "Carregando produtos..."
                : `${products.length} produto(s) nesta visualização`}
            </p>
          </div>

          {loading ? (
            <ProductListSkeleton />
          ) : products.length === 0 ? (
            <EmptyProducts onCreate={openCreateForm} />
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_20px_54px_rgba(41,37,36,0.05)]">
              <div className="hidden grid-cols-[minmax(360px,1fr)_150px_130px_160px_280px] border-b border-stone-200 bg-[#fbfaf7] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 xl:grid">
                <span>Produto</span>
                <span>Preço</span>
                <span>Estoque</span>
                <span>Status</span>
                <span className="text-right">Ações</span>
              </div>

              <div className="divide-y divide-stone-200">
                {products.map((product) => (
                  <AdminProductRow
                    key={product.id}
                    product={product}
                    onEdit={openEditForm}
                    onToggleActive={setProductToToggle}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {formOpen && (
          <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#1f1b16]/35 px-4 py-8 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_28px_80px_rgba(46,39,31,0.18)]">
              <div className="flex flex-col justify-between gap-4 border-b border-stone-200 px-6 py-5 md:flex-row md:items-start md:px-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                    {editingProduct ? "Editar produto" : "Novo produto"}
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-stone-950">
                    {editingProduct ? editingProduct.name : "Cadastrar produto"}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                    Preencha as informações comerciais e confira a imagem antes
                    de publicar na vitrine.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Fechar
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]"
              >
                <div className="space-y-7 p-6 md:p-8">
                  <FormSection
                    eyebrow="Dados principais"
                    title="Identificação do produto"
                    description="Nome, marca e categoria aparecem na vitrine e nas páginas de compra."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Nome"
                        value={form.name}
                        onChange={(value) => updateForm("name", value)}
                        required
                      />

                      <TextField
                        label="Marca"
                        value={form.brand}
                        onChange={(value) => updateForm("brand", value)}
                        required
                      />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <TextField
                        label="Grupo"
                        value={form.categoryGroup}
                        onChange={(value) => updateForm("categoryGroup", value)}
                        required
                      />

                      <TextField
                        label="Categoria"
                        value={form.category}
                        onChange={(value) => updateForm("category", value)}
                        required
                      />

                      <TextField
                        label="Modelo"
                        value={form.model}
                        onChange={(value) => updateForm("model", value)}
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    eyebrow="Conteúdo"
                    title="Descrição"
                    description="Use esse campo para explicar detalhes relevantes do produto."
                  >
                    <label className="block">
                      <span className="text-sm font-semibold text-stone-950">
                        Descrição
                      </span>

                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
                        }
                        rows={7}
                        required
                        placeholder="Descreva características, uso recomendado, compatibilidade e diferenciais."
                        className="mt-2 w-full resize-none rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] px-4 py-4 text-sm font-medium leading-6 text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
                      />
                    </label>
                  </FormSection>

                  <FormSection
                    eyebrow="Comercial"
                    title="Preço, estoque e publicação"
                    description="Essas informações controlam venda e disponibilidade."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Preço"
                        type="number"
                        value={form.price}
                        onChange={(value) => updateForm("price", value)}
                        required
                      />

                      <TextField
                        label="Estoque"
                        value={form.stockQuantity}
                        onChange={(value) =>
                          updateForm("stockQuantity", onlyInteger(value))
                        }
                        required
                        inputMode="numeric"
                      />
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-4">
                      <span>
                        <span className="block text-sm font-semibold text-stone-950">
                          Produto ativo na vitrine
                        </span>
                        <span className="mt-1 block text-sm text-stone-500">
                          Quando inativo, o produto continua no admin, mas sai
                          da loja pública.
                        </span>
                      </span>

                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) =>
                          updateForm("active", event.target.checked)
                        }
                        className="h-4 w-4 accent-[#8f6f2e]"
                      />
                    </label>
                  </FormSection>

                  <FormSection
                    eyebrow="Imagem"
                    title="Arquivo do produto"
                    description="Use imagens com fundo limpo e boa proporção para manter a vitrine consistente."
                  >
                    <div className="rounded-[1.5rem] border border-stone-200 bg-[#fbfaf7] p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[#8f6f2e]">
                          <Upload className="h-4 w-4" aria-hidden="true" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-stone-950">
                            Upload de imagem
                          </p>
                          <p className="mt-1 text-sm leading-6 text-stone-500">
                            JPG, PNG, WEBP ou GIF, até 5MB.
                          </p>
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="mt-5 block w-full rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#8f6f2e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />

                      {selectedFile && (
                        <p className="mt-3 text-sm text-stone-500">
                          Arquivo selecionado:{" "}
                          <span className="font-semibold text-stone-950">
                            {selectedFile.name}
                          </span>
                        </p>
                      )}

                      <label className="mt-5 block">
                        <span className="text-sm font-semibold text-stone-950">
                          URL atual da imagem
                        </span>

                        <input
                          value={form.imageUrl}
                          onChange={(event) =>
                            updateForm("imageUrl", event.target.value)
                          }
                          placeholder="/uploads/products/imagem.png"
                          className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f]"
                        />
                      </label>
                    </div>
                  </FormSection>
                </div>

                <aside className="border-t border-stone-200 bg-[#f1efea] p-6 lg:border-l lg:border-t-0 md:p-8">
                  <div className="lg:sticky lg:top-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f6f2e]">
                      Preview
                    </p>

                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
                      Como aparece na loja
                    </h3>

                    <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white">
                      <div className="flex h-72 items-end justify-center bg-[#f8f7f3] p-6">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview do produto"
                            className="h-full w-full object-contain object-bottom"
                          />
                        ) : (
                          <div className="text-center text-stone-500">
                            <ImageIcon
                              className="mx-auto h-10 w-10"
                              aria-hidden="true"
                            />
                            <p className="mt-3 text-sm font-semibold">
                              Sem imagem
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                          {form.brand || "Marca"}
                        </p>

                        <p className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-stone-950">
                          {form.name || "Nome do produto"}
                        </p>

                        <p className="mt-5 text-xs text-stone-500">Preço</p>
                        <p className="mt-1 text-xl font-semibold tracking-[-0.025em] text-stone-950">
                          {form.price
                            ? formatCurrency(Number(form.price))
                            : "R$ 0,00"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-white p-5">
                      <p className="text-sm font-semibold text-stone-950">
                        Resumo
                      </p>

                      <div className="mt-4 space-y-3 text-sm">
                        <SummaryRow
                          label="Grupo"
                          value={form.categoryGroup || "—"}
                        />
                        <SummaryRow
                          label="Categoria"
                          value={form.category || "—"}
                        />
                        <SummaryRow
                          label="Estoque"
                          value={form.stockQuantity || "0"}
                        />
                        <SummaryRow
                          label="Status"
                          value={form.active ? "Ativo" : "Inativo"}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f] disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      {saving && (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      {saving
                        ? "Salvando"
                        : editingProduct
                          ? "Salvar alterações"
                          : "Cadastrar produto"}
                    </button>
                  </div>
                </aside>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          open={Boolean(productToToggle)}
          title={
            productToToggle?.active ? "Desativar produto?" : "Reativar produto?"
          }
          message={
            productToToggle?.active
              ? "O produto deixará de aparecer na vitrine pública, mas continuará disponível no admin e no histórico de pedidos."
              : "O produto voltará a aparecer na vitrine pública se tiver estoque disponível."
          }
          confirmLabel={productToToggle?.active ? "Desativar" : "Reativar"}
          danger={Boolean(productToToggle?.active)}
          loading={saving}
          onClose={() => {
            if (!saving) setProductToToggle(null);
          }}
          onConfirm={handleToggleActive}
        />
      </div>
    </div>
  );
}

function AdminProductRow({
  product,
  onEdit,
  onToggleActive,
}: {
  product: ProductResponse;
  onEdit: (product: ProductResponse) => void;
  onToggleActive: (product: ProductResponse) => void;
}) {
  const imageUrl = buildPublicFileUrl(product.imageUrl);
  const status = getProductAdminStatus(product);

  return (
    <article className="grid gap-0 p-4 transition hover:bg-[#fbfaf7] xl:grid-cols-[minmax(360px,1fr)_150px_130px_160px_280px] xl:items-center xl:px-5">
      <div className="flex min-w-0 gap-4">
        <div className="flex h-28 w-28 shrink-0 items-end justify-center rounded-[1.35rem] bg-[#f1efea] p-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-contain object-bottom"
            />
          ) : (
            <PackageSearch
              className="mb-6 h-9 w-9 text-stone-400"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="min-w-0 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f6f2e]">
              {product.brand}
            </p>

            <StatusBadge active={product.active} />
          </div>

          <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-stone-950">
            {product.name}
          </h3>

          <p className="mt-2 line-clamp-1 text-sm text-stone-500">
            {product.categoryGroup
              ? `${product.categoryGroup} · ${product.category}`
              : product.category}
            {product.model ? ` · ${product.model}` : ""}
          </p>

          {isProductLowStock(product) && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f4ead0] px-3 py-1 text-xs font-bold text-[#8f6f2e]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Baixo estoque
            </p>
          )}

          {isProductOutOfStock(product) && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-danger-soft)] px-3 py-1 text-xs font-bold text-[var(--pc-danger)]">
              <PackageSearch className="h-3.5 w-3.5" aria-hidden="true" />
              Sem estoque
            </p>
          )}
        </div>
      </div>

      <AdminCell label="Preço" className="mt-5 xl:mt-0">
        <span className="whitespace-nowrap text-base font-semibold text-stone-950">
          {formatCurrency(product.price)}
        </span>
      </AdminCell>

      <AdminCell label="Estoque">
        <span className="whitespace-nowrap text-base font-semibold text-stone-950">
          {product.availableQuantity} un.
        </span>
        {product.stockQuantity !== product.availableQuantity && (
          <span className="mt-1 block text-xs text-stone-500">
            total: {product.stockQuantity}
          </span>
        )}
      </AdminCell>

      <AdminCell label="Status">
        <span
          className={`whitespace-nowrap text-sm font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </AdminCell>

      <div className="mt-5 flex flex-wrap gap-2 xl:mt-0 xl:flex-nowrap xl:justify-end">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 transition hover:border-[#d8c28f] hover:bg-[#fbfaf7] xl:flex-none"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onToggleActive(product)}
          className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition xl:flex-none ${
            product.active
              ? "bg-[var(--pc-danger)] hover:bg-[var(--pc-danger-hover)]"
              : "bg-[var(--pc-green)] hover:bg-[var(--pc-green-hover)]"
          }`}
        >
          {product.active ? (
            <PowerOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Power className="h-4 w-4" aria-hidden="true" />
          )}
          {product.active ? "Desativar" : "Ativar"}
        </button>
      </div>
    </article>
  );
}

function StockSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "danger";
}) {
  const toneClass =
    tone === "danger" ? "text-[var(--pc-danger)]" : "text-[#8f6f2e]";

  return (
    <div className="rounded-[1.35rem] border border-stone-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-semibold tracking-[-0.04em] ${toneClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function StockAlertItem({
  product,
  type,
}: {
  product: ProductResponse;
  type: "low" | "out";
}) {
  const isOut = type === "out";

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isOut
              ? "bg-[var(--pc-danger-soft)] text-[var(--pc-danger)]"
              : "bg-[#f4ead0] text-[#8f6f2e]"
          }`}
        >
          {isOut ? (
            <PackageSearch className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-stone-950">
            {product.name}
          </p>

          <p className="mt-1 text-xs leading-5 text-stone-500">
            {isOut
              ? "Produto sem unidades disponíveis."
              : `${product.availableQuantity} unidade(s) disponíveis.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "text-stone-500 bg-[#fbfaf7]",
    warning: "text-[#8f6f2e] bg-[#f4ead0]",
    danger: "text-[var(--pc-danger)] bg-[var(--pc-danger-soft)]",
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

function AdminCell({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-4 xl:mt-0 ${className}`}>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500 xl:hidden">
        {label}
      </p>
      {children}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        active
          ? "bg-[var(--pc-green-soft)] text-[var(--pc-green)]"
          : "bg-stone-100 text-stone-500"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function getProductAdminStatus(product: ProductResponse) {
  if (!product.active) {
    return {
      label: "Inativo",
      className: "text-stone-500",
    };
  }

  if (isProductOutOfStock(product)) {
    return {
      label: "Sem estoque",
      className: "text-[var(--pc-danger)]",
    };
  }

  if (isProductLowStock(product)) {
    return {
      label: "Baixo estoque",
      className: "text-[#8f6f2e]",
    };
  }

  return {
    label: "Disponível",
    className: "text-[var(--pc-green)]",
  };
}

function isProductOutOfStock(product: ProductResponse) {
  return product.outOfStock || product.availableQuantity <= 0;
}

function isProductLowStock(product: ProductResponse) {
  return (
    product.active &&
    !isProductOutOfStock(product) &&
    product.availableQuantity <= ADMIN_LOW_STOCK_THRESHOLD
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6f2e]">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-stone-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-950">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        inputMode={inputMode}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 h-12 w-full rounded-full border border-stone-200 bg-[#fbfaf7] px-4 text-sm font-medium text-stone-950 outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#d8c28f] focus:bg-white"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-stone-500">{label}</span>
      <span className="max-w-[180px] text-right font-semibold text-stone-950">
        {value}
      </span>
    </div>
  );
}

function EmptyProducts({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
      <PackageSearch
        className="mx-auto h-10 w-10 text-stone-400"
        aria-hidden="true"
      />

      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
        Nenhum produto encontrado
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
        Ajuste os filtros ou cadastre um novo produto para aparecer na vitrine.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#8f6f2e] px-5 text-sm font-semibold text-white transition hover:bg-[#76591f]"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Cadastrar produto
      </button>
    </section>
  );
}

function ProductListSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 border-b border-stone-200 p-4 last:border-b-0 xl:grid-cols-[minmax(360px,1fr)_150px_130px_160px_280px]"
        >
          <div className="flex gap-4">
            <div className="h-28 w-28 animate-pulse rounded-[1.35rem] bg-stone-200" />
            <div className="flex-1 py-2">
              <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
              <div className="mt-3 h-5 w-64 max-w-full animate-pulse rounded bg-stone-200" />
              <div className="mt-3 h-4 w-40 animate-pulse rounded bg-stone-200" />
            </div>
          </div>

          <div className="h-6 w-24 animate-pulse rounded bg-stone-200" />
          <div className="h-6 w-20 animate-pulse rounded bg-stone-200" />
          <div className="h-6 w-24 animate-pulse rounded bg-stone-200" />
          <div className="h-10 w-full animate-pulse rounded-full bg-stone-200" />
        </div>
      ))}
    </div>
  );
}

function onlyInteger(value: string) {
  return value.replace(/\D/g, "");
}
