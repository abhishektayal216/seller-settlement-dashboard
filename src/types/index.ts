export type Platform = 'amazon' | 'meesho' | 'unknown';

export interface ParsedTransaction {
  id: string;
  platform: Platform;
  date: string;
  orderId?: string;
  sku?: string;
  description?: string;
  type: string;
  amount: number;
  category: 'sales' | 'refund' | 'fee' | 'tax' | 'shipping' | 'ad' | 'other' | 'settlement';
  raw?: Record<string, any>;
}

export interface SummaryMetrics {
  grossSales: number;
  netSales: number;
  totalRefunds: number;
  totalFees: number;
  totalShipping: number;
  totalTCS: number;
  totalTDS: number;
  totalAds: number;
  netSettlement: number;
  returnRate: number;
  feePercentage: number;
  transactionCount: number;
  orderCount: number;
  refundCount: number;
  byPlatform: {
    amazon: Partial<SummaryMetrics>;
    meesho: Partial<SummaryMetrics>;
  };
}

export interface FeeBreakdownItem {
  name: string;
  value: number;
  percentage: number;
}

export interface SkuPerformance {
  sku: string;
  sales: number;
  refunds: number;
  fees: number;
  net: number;
  units?: number;
}

export interface DashboardData {
  transactions: ParsedTransaction[];
  summary: SummaryMetrics;
  feeBreakdown: FeeBreakdownItem[];
  skuPerformance: SkuPerformance[];
  dailyTrend: { date: string; sales: number; settlement: number; fees: number }[];
  uploadedFiles: { name: string; platform: Platform; rows: number }[];
}
