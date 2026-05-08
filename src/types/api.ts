export type ApiError = {
  timestamp?: string;
  status: number;
  title: string;
  detail: string;
  instance?: string;
};

export type ApiErrorResponse = ApiError;

export type ApiBooleanResponse = {
  favorited?: boolean;
  exists?: boolean;
  value?: boolean;
};

export type ApiCountResponse = {
  count: number;
};