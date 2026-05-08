import { expect, test } from "@playwright/test";
import { installApiMocks, loginAsCustomer } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("cliente visualiza carrinho e finaliza para pagamento", async ({ page }) => {
  await loginAsCustomer(page);

  await page.goto("/carrinho");

  await expect(page.getByText("Carrinho")).toBeVisible();
  await expect(page.getByText("Notebook PointClick Pro")).toBeVisible();

  await page.getByRole("button", { name: "Finalizar compra" }).click();

  await expect(page).toHaveURL(/\/pagamento\/10/);
});
