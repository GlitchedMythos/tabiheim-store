/**
 * Type definitions for API responses
 * These mirror the backend DTOs from apps/api/src/dtos/index.ts
 */

export interface ProductSearchQuery {
  searchText?: string;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

export interface ProductPrice {
  lowPrice: string | null;
  midPrice: string | null;
  highPrice: string | null;
  marketPrice: string | null;
  directLowPrice: string | null;
  recordedAt: Date;
}

export interface ProductSubtype {
  subTypeName: string;
  latestPrice: ProductPrice | null;
}

export interface Product {
  productId: number;
  name: string;
  cleanName: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  groupId: number;
  url: string | null;
  modifiedOn: Date | null;
  imageCount: number | null;
  group: {
    name: string | null;
    abbreviation: string | null;
  };
  subtypes: ProductSubtype[];
  extendedData?: Array<{
    name: string;
    displayName: string | null;
    value: string | null;
  }>;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductSearchResponse {
  data: Product[];
  pagination: Pagination;
}

export interface Category {
  categoryId: number;
  name: string;
  displayName: string | null;
  modifiedOn: Date | null;
}

