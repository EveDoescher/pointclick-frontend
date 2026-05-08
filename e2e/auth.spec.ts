import { expect, test } from "@playwright/test";
import { installApiMocks } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("cliente consegue fazer login", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("button", { name: /^Entrar$/ })).toBeVisible();

  await page.getByPlaceholder("voce@email.com").fill("cliente@pointclick.com");
  await page.getByPlaceholder("Sua senha").fill("123456");
  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page).toHaveURL(/\/$/);
});

test("usuário consegue criar conta e ser redirecionado", async ({ page }) => {
  await page.goto("/cadastro");

  await page.getByPlaceholder("Ana Souza").fill("Ana Souza");
  await page.getByPlaceholder("ana@email.com").fill("ana@email.com");
  await page.getByPlaceholder("Mínimo 6 caracteres").fill("123456");
  await page.getByPlaceholder("Repita a senha").fill("123456");
  await page.getByRole("button", { name: /^Criar conta$/ }).click();

  await expect(page).toHaveURL(/\/$/);
});
