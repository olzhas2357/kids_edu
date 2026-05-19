export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
