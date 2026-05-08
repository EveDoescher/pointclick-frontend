import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://localhost:8080/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),
];
