import { expect, test } from "@playwright/test";
import { installApiMocks, loginAsCustomer, paymentPix } from "./helpers/mock-api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
};

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test("cliente visualiza pagamento PIX do pedido fechado", async ({ page }) => {
  await loginAsCustomer(page);

  await page.route("**/payments/orders/10", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: "",
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders,
      body: JSON.stringify(paymentPix),
    });
  });

  await page.goto("/pagamento/10");

  await expect(page.getByRole("heading", { name: /Pedido #\s*10/i })).toBeVisible();
  await expect(page.getByText("Código PIX")).toBeVisible();
  await expect(page.getByText("PIX-CODE-123")).toBeVisible();
});
