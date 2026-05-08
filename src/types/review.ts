export type CreateReviewRequest = {
  rating: number;
  comment?: string;
  images?: File[];
};

export type ReviewImageResponse = {
  id: number;
  imageUrl: string;
  displayOrder: number;
};

export type ReviewSummaryResponse = {
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
  withComments: number;
  withMedia: number;
};

export type ReviewResponse = {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  userId: number;
  userFullName: string;
  userAvatarUrl: string | null;
  rating: number;
  comment: string;
  imageCount: number;
  images: ReviewImageResponse[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReviewFilters = {
  rating?: number | null;
  withComment?: boolean | null;
  withMedia?: boolean | null;
};
