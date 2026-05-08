import { expect, test } from "@playwright/test";
import { installApiMocks, loginAsAdmin } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("admin acessa dashboard", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page.getByText("Painel administrativo")).toBeVisible();
  await expect(page.getByText("Fila operacional")).toBeVisible();
});

test("admin acessa produtos e cupons", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/admin/produtos");
  await expect(page.getByText("Admin • Produtos")).toBeVisible();
  await expect(page.getByText("Notebook PointClick Pro")).toBeVisible();

  await page.goto("/admin/cupons");
  await expect(page.getByText("Admin • Cupons")).toBeVisible();
  await expect(page.getByText("POINT10")).toBeVisible();
});

test("admin acessa pedidos e usuários", async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto("/admin/pedidos");
  await expect(page.getByText("Admin • Pedidos")).toBeVisible();

  await page.goto("/admin/usuarios");
  await expect(page.getByText("Admin • Usuários")).toBeVisible();
  await expect(page.getByText("Cliente PointClick")).toBeVisible();
});
