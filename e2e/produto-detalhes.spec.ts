import { expect, test } from "@playwright/test";
import { installApiMocks } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("página de detalhes exibe produto e calcula frete", async ({ page }) => {
  await page.goto("/produtos/1");

  await expect(page.getByText("Notebook PointClick Pro")).toBeVisible();
  await expect(page.getByText("Sobre o produto")).toBeVisible();

  await page.getByPlaceholder("Digite seu CEP").fill("13480000");
  await page.getByRole("button", { name: "Calcular" }).click();

  await expect(page.getByText("Limeira, SP")).toBeVisible();
});

test("visitante é direcionado ao login ao favoritar", async ({ page }) => {
  await page.goto("/produtos/1");

  await expect(page.getByText("Notebook PointClick Pro")).toBeVisible();

  await page.getByRole("button", { name: "Adicionar aos favoritos" }).first().click();

  await expect(page).toHaveURL(/\/login/);
});
