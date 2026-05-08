import { expect, test } from "@playwright/test";
import { installApiMocks, loginAsCustomer } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("cliente acessa minha conta e consegue acionar salvamento do perfil", async ({
  page,
}) => {
  await loginAsCustomer(page);

  await page.goto("/minha-conta");

  await expect(page.getByText("Minha conta")).toBeVisible();
  await expect(page.getByText("cliente@pointclick.com")).toBeVisible();

  const saveProfileButton = page.getByRole("button", { name: "Salvar perfil" });

  await expect(saveProfileButton).toBeVisible();
  await saveProfileButton.click();

  await expect(page.getByText("Minha conta")).toBeVisible();
});
