import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    include: [
      "src/utils/**/*.test.ts",
      "src/services/**/*.test.ts",
      "src/contexts/**/*.test.tsx",
      "src/components/**/*.test.tsx",

      "src/app/__tests__/home.page.test.tsx",
      "src/app/login/__tests__/login.page.test.tsx",
      "src/app/cadastro/__tests__/cadastro.page.test.tsx",
      "src/app/produtos/__tests__/produtos.page.test.tsx",
      "src/app/produtos/[id]/__tests__/produto-detalhes.page.test.tsx",
      "src/app/carrinho/__tests__/carrinho.page.test.tsx",

      "src/app/favoritos/__tests__/favoritos.page.test.tsx",
      "src/app/minha-conta/__tests__/minha-conta.page.test.tsx",
      "src/app/notificacoes/__tests__/notificacoes.page.test.tsx",
      "src/app/pagamento/__tests__/pagamento.page.test.tsx",
      "src/app/pagamento/[orderId]/__tests__/pagamento-pedido.page.test.tsx",
      "src/app/pedidos/__tests__/pedidos.page.test.tsx",
      "src/app/pedidos/[orderId]/__tests__/pedido-detalhes.page.test.tsx",

      "src/app/admin/__tests__/admin-dashboard.page.test.tsx",
      "src/app/admin/produtos/__tests__/admin-produtos.page.test.tsx",
      "src/app/admin/pedidos/__tests__/admin-pedidos.page.test.tsx",
      "src/app/admin/pedidos/[orderId]/__tests__/admin-pedido-detalhes.page.test.tsx",
      "src/app/admin/usuarios/__tests__/admin-usuarios.page.test.tsx",
      "src/app/admin/cupons/__tests__/admin-cupons.page.test.tsx"
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "e2e/**"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: [
        "src/utils/**/*.ts",
        "src/services/**/*.ts",
        "src/contexts/**/*.tsx",
        "src/components/**/*.tsx",
        "src/app/page.tsx",
        "src/app/login/page.tsx",
        "src/app/cadastro/page.tsx",
        "src/app/produtos/page.tsx",
        "src/app/produtos/[id]/page.tsx",
        "src/app/carrinho/page.tsx",
        "src/app/favoritos/page.tsx",
        "src/app/minha-conta/page.tsx",
        "src/app/notificacoes/page.tsx",
        "src/app/pagamento/page.tsx",
        "src/app/pagamento/[orderId]/page.tsx",
        "src/app/pedidos/page.tsx",
        "src/app/pedidos/[orderId]/page.tsx",
        "src/app/admin/page.tsx",
        "src/app/admin/produtos/page.tsx",
        "src/app/admin/pedidos/page.tsx",
        "src/app/admin/pedidos/[orderId]/page.tsx",
        "src/app/admin/usuarios/page.tsx",
        "src/app/admin/cupons/page.tsx"
      ],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/test/**"
      ],
    },
  },
});
