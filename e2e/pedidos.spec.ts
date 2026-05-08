import { expect, test } from "@playwright/test";
import { installApiMocks, loginAsCustomer } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("cliente visualiza pedidos e detalhes", async ({ page }) => {
  await loginAsCustomer(page);

  await page.goto("/pedidos");

  await expect(page.getByText("Meus pedidos")).toBeVisible();
  await expect(page.getByText("#10")).toBeVisible();

  await page.getByRole("link", { name: /Ver detalhes|Detalhes/i }).first().click();

  await expect(page).toHaveURL(/\/pedidos\/10/);
  await expect(page.getByText("Detalhes do pedido")).toBeVisible();
  await expect(page.getByText("Notebook PointClick Pro").first()).toBeVisible();
});
