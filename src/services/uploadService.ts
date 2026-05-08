import type { UploadResponse } from "@/types/upload";
import { apiFetch } from "./api";

export const uploadService = {
  async uploadProductImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<UploadResponse>("/uploads/products", {
      method: "POST",
      body: formData,
    });
  },
};