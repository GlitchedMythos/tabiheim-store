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
  subtypeId: number;
  subTypeName: string;
  latestPrice: ProductPrice | null;
}

// Minimal product response (fast search)
export interface ProductMinimal {
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
  extendedData: Array<{
    name: string;
    displayName: string | null;
    value: string | null;
  }>;
}

// Full product with subtypes (for backward compatibility or when prices are loaded)
export interface Product extends ProductMinimal {
  subtypes?: ProductSubtype[];
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
  data: ProductMinimal[];
  pagination: Pagination;
}

// Product prices response (separate endpoint)
export interface ProductPricesResponse {
  data: Record<string, ProductSubtype[]>;
}

export interface Category {
  categoryId: number;
  name: string;
  displayName: string | null;
  modifiedOn: Date | null;
}

