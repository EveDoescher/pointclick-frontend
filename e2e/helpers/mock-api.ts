import { expect, type Page, type Route } from "@playwright/test";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

export const customerUser = {
  id: 1,
  fullName: "Cliente PointClick",
  email: "cliente@pointclick.com",
  role: "CUSTOMER",
};

export const adminUser = {
  id: 2,
  fullName: "Admin PointClick",
  email: "admin@pointclick.com",
  role: "ADMIN",
};

export const customerProfile = {
  id: 1,
  fullName: "Cliente PointClick",
  email: "cliente@pointclick.com",
  cpf: "12345678909",
  phone: "19999999999",
  avatarUrl: null,
  role: "CUSTOMER",
  active: true,
  address: {
    id: 1,
    cep: "13480000",
    street: "Rua Teste",
    number: "123",
    complement: null,
    city: "Limeira",
    state: "SP",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  profileCompleteForCheckout: true,
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

export const adminProfile = {
  ...customerProfile,
  id: 2,
  fullName: "Admin PointClick",
  email: "admin@pointclick.com",
  role: "ADMIN",
};

export const product = {
  id: 1,
  name: "Notebook PointClick Pro",
  description: "Notebook premium para produtividade.",
  categoryGroup: "Computadores e Mobile",
  category: "Notebook",
  brand: "PointClick",
  model: "PC-Pro-14",
  price: 4999.9,
  stockQuantity: 20,
  reservedQuantity: 2,
  availableQuantity: 18,
  imageUrl: "/uploads/products/notebook.png",
  active: true,
  outOfStock: false,
  lowStock: false,
  favoriteCount: 3,
  reviewCount: 2,
  averageRating: 4.5,
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

export const secondProduct = {
  ...product,
  id: 2,
  name: "Headset Studio",
  description: "Headset confortável para reuniões e jogos.",
  categoryGroup: "Áudio",
  category: "Headset",
  brand: "AudioLab",
  model: "Studio-H1",
  price: 699.9,
  imageUrl: "/uploads/products/headset.png",
};

export const order = {
  id: 10,
  userId: 1,
  userFullName: "Cliente PointClick",
  orderDate: "2026-05-01T10:00:00Z",
  itemsAmount: 4999.9,
  discountAmount: 0,
  freightAmount: 29.9,
  totalAmount: 5029.8,
  couponCode: null,
  status: "PENDING",
  paymentMethod: null,
  deliveryAddress: null,
  notes: null,
  closedAt: null,
  paidAt: null,
  shippedAt: null,
  deliveredAt: null,
  finishedAt: null,
  cancelledAt: null,
  reservationExpiresAt: null,
  items: [
    {
      id: 100,
      productId: 1,
      productName: "Notebook PointClick Pro",
      productBrand: "PointClick",
      productCategory: "Notebook",
      productImageUrl: "/uploads/products/notebook.png",
      quantity: 1,
      unitPriceAtMoment: 4999.9,
      subtotal: 4999.9,
      createdAt: "2026-05-01T10:00:00Z",
      updatedAt: "2026-05-01T10:00:00Z",
    },
  ],
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

export const closedOrder = {
  ...order,
  status: "CLOSED",
  closedAt: "2026-05-01T10:10:00Z",
  deliveryAddress: "Rua Teste, 123 - Limeira/SP",
};

export const paidOrder = {
  ...closedOrder,
  status: "PAID",
  paymentMethod: "PIX",
  paidAt: "2026-05-01T10:20:00Z",
};

export const finishedOrder = {
  ...paidOrder,
  status: "FINISHED",
  shippedAt: "2026-05-02T10:00:00Z",
  deliveredAt: "2026-05-03T10:00:00Z",
  finishedAt: "2026-05-03T12:00:00Z",
};

export const orderSummary = {
  id: 10,
  orderDate: "2026-05-01T10:00:00Z",
  itemsAmount: 4999.9,
  discountAmount: 0,
  freightAmount: 29.9,
  totalAmount: 5029.8,
  couponCode: null,
  status: "CLOSED",
  paymentMethod: "PIX",
  createdAt: "2026-05-01T10:00:00Z",
};

export const finishedOrderSummary = {
  ...orderSummary,
  id: 11,
  status: "FINISHED",
  paymentMethod: "CREDIT_CARD",
  totalAmount: 719.9,
  createdAt: "2026-05-02T10:00:00Z",
};

export const notification = {
  id: 1,
  type: "PAYMENT_APPROVED",
  title: "Pagamento aprovado",
  message: "Seu pedido foi aprovado.",
  linkUrl: "/pedidos/10",
  read: false,
  readAt: null,
  createdAt: "2026-05-01T10:00:00Z",
};

export const paymentPix = {
  id: 1,
  orderId: 10,
  method: "PIX",
  status: "PENDING",
  amount: 5029.8,
  installments: null,
  cardLastFourDigits: null,
  pixCode: "PIX-CODE-123",
  pixQrCodeBase64: null,
  pixConfirmationUrl: "https://example.com/pix",
  bankSlipBarCode: null,
  bankSlipBarCodeBase64: null,
  bankSlipConfirmationUrl: null,
  digitableLine: null,
  notes: null,
  createdAt: "2026-05-01T10:00:00Z",
  confirmedAt: null,
  cancelledAt: null,
};

function isApiUrl(url: URL) {
  return (
    (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
    url.port === "8080"
  );
}

function getAuthUser(route: Route) {
  const auth = route.request().headers()["authorization"] ?? "";
  return auth.includes("admin-token") ? adminUser : customerUser;
}

function getAuthProfile(route: Route) {
  const auth = route.request().headers()["authorization"] ?? "";
  return auth.includes("admin-token") ? adminProfile : customerProfile;
}

export async function installApiMocks(page: Page) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isApiUrl(url)) {
      await route.continue();
      return;
    }

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: "",
      });
      return;
    }

    await handleApiRoute(route, url, request.method());
  });
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: corsHeaders,
    body: JSON.stringify(body),
  });
}

async function image(route: Route) {
  const onePixelPng =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

  await route.fulfill({
    status: 200,
    contentType: "image/png",
    headers: corsHeaders,
    body: Buffer.from(onePixelPng, "base64"),
  });
}

async function handleApiRoute(route: Route, url: URL, method: string) {
  const path = url.pathname;

  if (path.startsWith("/uploads/")) {
    await image(route);
    return;
  }

  if (method === "POST" && path === "/auth/login") {
    const rawBody = route.request().postData();
    let body: Record<string, unknown> = {};

    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      body = {};
    }

    const isAdmin = String(body?.email ?? "").includes("admin");

    await json(route, {
      token: isAdmin ? "admin-token" : "customer-token",
      refreshToken: isAdmin ? "admin-refresh" : "customer-refresh",
      type: "Bearer",
      expiresIn: 3600,
      user: isAdmin ? adminUser : customerUser,
    });
    return;
  }

  if (path === "/auth/me") {
    await json(route, getAuthUser(route));
    return;
  }

  if (method === "POST" && path === "/auth/logout") {
    await json(route, {});
    return;
  }

  if (method === "POST" && path === "/users") {
    await json(route, customerProfile, 201);
    return;
  }

  if (path === "/users/me") {
    if (method === "GET") {
      await json(route, getAuthProfile(route));
      return;
    }

    if (method === "PATCH" || method === "PUT" || method === "POST") {
      await json(route, getAuthProfile(route));
      return;
    }
  }

  if (path === "/users/me/profile") {
    await json(route, getAuthProfile(route));
    return;
  }

  if (path === "/users/me/address") {
    await json(route, getAuthProfile(route).address);
    return;
  }

  if (path === "/shipping/cep/13480000" || path === "/shipping/cep/01001000") {
    await json(route, {
      cep: "13480000",
      street: "Rua Teste",
      district: "Centro",
      city: "Limeira",
      state: "SP",
    });
    return;
  }

  if (path === "/shipping/quote") {
    await json(route, {
      cep: url.searchParams.get("cep") ?? "13480000",
      shippingPrice: 25,
      estimatedDays: 3,
      street: "Rua Teste",
      district: "Centro",
      city: "Limeira",
      state: "SP",
    });
    return;
  }

  if (path === "/products" && method === "GET") {
    await json(route, [product, secondProduct]);
    return;
  }

  if (path === "/products/1") {
    await json(route, product);
    return;
  }

  if (path === "/products/1/related") {
    await json(route, [secondProduct]);
    return;
  }

  if (path === "/products/categories") {
    await json(route, ["Notebook", "Headset"]);
    return;
  }

  if (path === "/products/brands") {
    await json(route, ["PointClick", "AudioLab"]);
    return;
  }

  if (path === "/products/category-groups") {
    await json(route, ["Computadores e Mobile", "Áudio"]);
    return;
  }

  if (path === "/products/admin" && method === "GET") {
    await json(route, [product, secondProduct]);
    return;
  }

  if (path === "/products/admin/categories") {
    await json(route, ["Notebook", "Headset"]);
    return;
  }

  if (path === "/products/admin/category-groups") {
    await json(route, ["Computadores e Mobile", "Áudio"]);
    return;
  }

  if (path === "/favorites" && method === "GET") {
    await json(route, [
      {
        id: 1,
        userId: 1,
        product,
        createdAt: "2026-05-01T10:00:00Z",
      },
    ]);
    return;
  }

  if (path === "/favorites/products/1/exists") {
    await json(route, { favorited: false });
    return;
  }

  if (path === "/favorites/products/1") {
    await json(route, {});
    return;
  }

  if (path === "/products/1/reviews/summary") {
    await json(route, {
      averageRating: 4.5,
      totalReviews: 2,
      fiveStars: 1,
      fourStars: 1,
      threeStars: 0,
      twoStars: 0,
      oneStar: 0,
      withComments: 1,
      withMedia: 0,
    });
    return;
  }

  if (path === "/products/1/reviews") {
    await json(route, []);
    return;
  }

  if (path === "/reviews/my") {
    await json(route, []);
    return;
  }

  if (path === "/orders/current") {
    await json(route, order);
    return;
  }

  if (path === "/orders" && method === "POST") {
    await json(route, order, 201);
    return;
  }

  if (path === "/orders/my") {
    await json(route, [orderSummary, finishedOrderSummary]);
    return;
  }

  if (path === "/orders" && method === "GET") {
    await json(route, [
      {
        id: 10,
        customerId: 1,
        customerName: "Cliente PointClick",
        customerEmail: "cliente@pointclick.com",
        status: "PAID",
        itemsAmount: 4999.9,
        discountAmount: 0,
        freightAmount: 29.9,
        totalAmount: 5029.8,
        couponCode: null,
        paymentMethod: "PIX",
        paidAt: "2026-05-01T11:00:00Z",
        shippedAt: null,
        deliveredAt: null,
        finishedAt: null,
        createdAt: "2026-05-01T10:00:00Z",
      },
    ]);
    return;
  }

  if (path === "/orders/10" && method === "GET") {
    await json(route, finishedOrder);
    return;
  }

  if (path === "/orders/admin/10") {
    await json(route, paidOrder);
    return;
  }

  if (path === "/orders/10/items" && method === "POST") {
    await json(route, order);
    return;
  }

  if (path === "/orders/10/items/100") {
    await json(route, order);
    return;
  }

  if (path === "/orders/10/coupon") {
    await json(route, {
      ...order,
      couponCode: "POINT10",
      discountAmount: 10,
    });
    return;
  }

  if (path === "/orders/10/close") {
    await json(route, closedOrder);
    return;
  }

  if (path === "/orders/10/ship") {
    await json(route, { ...paidOrder, status: "SHIPPED" });
    return;
  }

  if (path === "/orders/10/deliver") {
    await json(route, { ...paidOrder, status: "DELIVERED" });
    return;
  }

  if (path === "/orders/10/confirm-delivery") {
    await json(route, finishedOrder);
    return;
  }

  if (path === "/orders/10/cancel") {
    await json(route, { ...order, status: "CANCELLED" });
    return;
  }

  if (path === "/orders/10/reopen-expired") {
    await json(route, order);
    return;
  }

  if (path === "/orders/summary") {
    await json(route, {
      pending: 0,
      closed: 1,
      paid: 1,
      shipped: 0,
      delivered: 0,
      finished: 1,
      cancelled: 0,
    });
    return;
  }

  if (path === "/payments/orders/10") {
    if (method === "GET") {
      await json(
        route,
        { status: 404, title: "Não encontrado", detail: "Sem pagamento" },
        404
      );
      return;
    }

    if (method === "POST") {
      await json(route, paymentPix, 201);
      return;
    }
  }

  if (path === "/notifications/unread-count") {
    await json(route, { count: 1 });
    return;
  }

  if (path === "/notifications") {
    await json(route, [notification]);
    return;
  }

  if (path === "/notifications/1/read") {
    await json(route, { ...notification, read: true });
    return;
  }

  if (path === "/notifications/read-all") {
    await json(route, {});
    return;
  }

  if (path === "/notifications/1") {
    await json(route, {});
    return;
  }

  if (path === "/admin/dashboard") {
    await json(route, {
      totalOrders: 12,
      pendingOrders: 1,
      closedOrders: 2,
      paidOrders: 3,
      shippedOrders: 1,
      deliveredOrders: 1,
      finishedOrders: 4,
      cancelledOrders: 1,
      totalRevenue: 12500,
      activeProducts: 20,
      inactiveProducts: 2,
      outOfStockProducts: 1,
      lowStockProducts: 3,
      activeUsers: 30,
      inactiveUsers: 2,
      customerUsers: 28,
      adminUsers: 2,
    });
    return;
  }

  if (path === "/coupons") {
    await json(route, [
      {
        id: 1,
        code: "POINT10",
        description: "Cupom de boas-vindas",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minimumOrderValue: 100,
        active: true,
        startsAt: null,
        endsAt: null,
        usageLimit: 100,
        usedCount: 2,
        currentlyValid: true,
        createdAt: "2026-05-01T10:00:00Z",
        updatedAt: "2026-05-01T10:00:00Z",
      },
    ]);
    return;
  }

  if (path === "/users") {
    await json(route, [
      customerProfile,
      {
        ...customerProfile,
        id: 2,
        fullName: "Admin PointClick",
        email: "admin@pointclick.com",
        role: "ADMIN",
      },
    ]);
    return;
  }

  await json(
    route,
    {
      status: 404,
      title: "Mock não encontrado",
      detail: `${method} ${path}`,
    },
    404
  );
}

export async function loginAsCustomer(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("voce@email.com").fill("cliente@pointclick.com");
  await page.getByPlaceholder("Sua senha").fill("123456");
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("voce@email.com").fill("admin@pointclick.com");
  await page.getByPlaceholder("Sua senha").fill("123456");
  await page.getByRole("button", { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/admin/);
}
