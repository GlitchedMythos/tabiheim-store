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

// Full product detail response (single product endpoint)
export interface ProductDetail {
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
    groupId: number;
    name: string;
    abbreviation: string | null;
    isSupplemental: boolean | null;
    publishedOn: Date | null;
    modifiedOn: Date | null;
    categoryId: number | null;
  } | null;
  category: {
    categoryId: number;
    name: string;
    displayName: string | null;
    modifiedOn: Date | null;
  } | null;
  subtypes: ProductSubtype[];
  extendedData: Array<{
    name: string;
    displayName: string | null;
    value: string | null;
  }>;
}

// Price timeline point
export interface PriceTimelinePoint {
  bucket: Date;
  avgLowPrice: string | null;
  avgMidPrice: string | null;
  avgHighPrice: string | null;
  avgMarketPrice: string | null;
  avgDirectLowPrice: string | null;
  minLowPrice: string | null;
  maxHighPrice: string | null;
  dataPoints: number;
}

// Price timeline response
export interface ProductPriceTimeline {
  productId: number;
  subtypes: Array<{
    subtypeId: number;
    subTypeName: string;
    timeline: PriceTimelinePoint[];
  }>;
}

// Sparkline data types
export interface SparklinePoint {
  date: Date;
  marketPrice: number;
}

export interface ProductSubtypeSparkline {
  subtypeId: number;
  subTypeName: string;
  sparklineData: SparklinePoint[];
}

export interface ProductSparklinesResponse {
  data: Record<string, ProductSubtypeSparkline[]>;
}

