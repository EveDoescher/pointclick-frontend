import { expect, test } from "@playwright/test";
import { installApiMocks } from "./helpers/mock-api";

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("home exibe produtos em destaque", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Curadoria de tecnologia/i })
  ).toBeVisible();
  await expect(page.getByText("Notebook PointClick Pro")).toBeVisible();
  await expect(page.getByText("Headset Studio")).toBeVisible();
});

test("catálogo lista produtos e aceita busca", async ({ page }) => {
  await page.goto("/produtos");

  await expect(page.getByText("Eletrônicos e acessórios")).toBeVisible();
  await expect(page.getByText("Notebook PointClick Pro")).toBeVisible();

  await page.getByPlaceholder("Buscar produto, marca ou descrição").fill("notebook");
  await expect(page.getByText("Notebook PointClick Pro")).toBeVisible();
});
