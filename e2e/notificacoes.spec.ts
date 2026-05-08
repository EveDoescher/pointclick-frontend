import { expect, test } from "@playwright/test";
import { installApiMocks, loginAsCustomer } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("cliente visualiza notificações", async ({ page }) => {
  await loginAsCustomer(page);

  await page.goto("/notificacoes");

  await expect(page.getByText("Notificações")).toBeVisible();
  await expect(page.getByText("Pagamento aprovado").first()).toBeVisible();

  await page.getByRole("button", { name: "Marcar todas como lidas" }).click();

  await expect(page.getByText("Notificações")).toBeVisible();
});
