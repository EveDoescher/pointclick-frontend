import type {
  CreateReviewRequest,
  ReviewFilters,
  ReviewResponse,
  ReviewSummaryResponse,
} from "@/types/review";
import { apiFetch, buildQueryParams } from "./api";

export const reviewService = {
  async create(
    orderId: number,
    productId: number,
    request: CreateReviewRequest
  ): Promise<ReviewResponse> {
    const formData = new FormData();

    formData.append("rating", String(request.rating));

    if (request.comment?.trim()) {
      formData.append("comment", request.comment.trim());
    }

    request.images?.forEach((image) => {
      formData.append("images", image);
    });

    return apiFetch<ReviewResponse>(
      `/orders/${orderId}/products/${productId}/reviews`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  async findByProductId(
    productId: number,
    filters: ReviewFilters = {}
  ): Promise<ReviewResponse[]> {
    const query = buildQueryParams({
      rating: filters.rating,
      withComment: filters.withComment,
      withMedia: filters.withMedia,
    });

    return apiFetch<ReviewResponse[]>(`/products/${productId}/reviews${query}`, {
      method: "GET",
      auth: false,
    });
  },

  async getSummaryByProductId(productId: number): Promise<ReviewSummaryResponse> {
    return apiFetch<ReviewSummaryResponse>(
      `/products/${productId}/reviews/summary`,
      {
        method: "GET",
        auth: false,
      }
    );
  },

  async findMyReviews(): Promise<ReviewResponse[]> {
    return apiFetch<ReviewResponse[]>("/reviews/my", {
      method: "GET",
    });
  },

  async delete(reviewId: number): Promise<void> {
    return apiFetch<void>(`/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },
};
