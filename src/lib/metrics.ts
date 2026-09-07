import { ParsedTransaction, SummaryMetrics, FeeBreakdownItem, SkuPerformance, DashboardData } from '../types';

export function computeDashboard(transactions: ParsedTransaction[], uploadedFiles: { name: string; platform: any; rows: number }[]): DashboardData {
  const summary = emptySummary();
  const feeMap: Record<string, number> = {};
  const skuMap: Record<string, SkuPerformance> = {};
  const dailyMap: Record<string, { sales: number; settlement: number; fees: number }> = {};

  let orderIds = new Set<string>();
  let refundIds = new Set<string>();

  for (const t of transactions) {
    const abs = Math.abs(t.amount);

    const plat = t.platform === 'amazon' ? summary.byPlatform.amazon : summary.byPlatform.meesho;
    if (!plat.grossSales) Object.assign(plat, emptyPartial());

    switch (t.category) {
      case 'sales':
        summary.grossSales += abs;
        (plat as any).grossSales = ((plat as any).grossSales || 0) + abs;
        if (t.orderId) orderIds.add(t.orderId);
        break;
      case 'refund':
        summary.totalRefunds += abs;
        (plat as any).totalRefunds = ((plat as any).totalRefunds || 0) + abs;
        if (t.orderId) refundIds.add(t.orderId);
        break;
      case 'fee':
        summary.totalFees += abs;
        (plat as any).totalFees = ((plat as any).totalFees || 0) + abs;
        feeMap[t.description || 'Other Fee'] = (feeMap[t.description || 'Other Fee'] || 0) + abs;
        break;
      case 'shipping':
        summary.totalShipping += abs;
        summary.totalFees += abs;
        (plat as any).totalShipping = ((plat as any).totalShipping || 0) + abs;
        feeMap[t.description || 'Shipping'] = (feeMap[t.description || 'Shipping'] || 0) + abs;
        break;
      case 'tax':
        if ((t.description || '').toLowerCase().includes('tcs')) {
          summary.totalTCS += abs;
          (plat as any).totalTCS = ((plat as any).totalTCS || 0) + abs;
        } else {
          summary.totalTDS += abs;
          (plat as any).totalTDS = ((plat as any).totalTDS || 0) + abs;
        }
        break;
      case 'ad':
        summary.totalAds += abs;
        (plat as any).totalAds = ((plat as any).totalAds || 0) + abs;
        feeMap['Advertising'] = (feeMap['Advertising'] || 0) + abs;
        break;
      default:
        break;
    }

    summary.netSettlement += t.amount;
    (plat as any).netSettlement = ((plat as any).netSettlement || 0) + t.amount;

    if (t.sku) {
      if (!skuMap[t.sku]) {
        skuMap[t.sku] = { sku: t.sku, sales: 0, refunds: 0, fees: 0, net: 0 };
      }
      const s = skuMap[t.sku];
      if (t.category === 'sales') s.sales += abs;
      if (t.category === 'refund') s.refunds += abs;
      if (t.category === 'fee' || t.category === 'shipping') s.fees += abs;
      s.net += t.amount;
    }

    const d = t.date.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { sales: 0, settlement: 0, fees: 0 };
    if (t.category === 'sales') dailyMap[d].sales += abs;
    if (t.category === 'fee' || t.category === 'shipping' || t.category === 'ad') dailyMap[d].fees += abs;
    dailyMap[d].settlement += t.amount;
  }

  summary.netSales = summary.grossSales - summary.totalRefunds;
  summary.returnRate = summary.grossSales > 0 ? (summary.totalRefunds / summary.grossSales) * 100 : 0;
  summary.feePercentage = summary.grossSales > 0 ? ((summary.totalFees + summary.totalShipping) / summary.grossSales) * 100 : 0;
  summary.transactionCount = transactions.length;
  summary.orderCount = orderIds.size;
  summary.refundCount = refundIds.size;

  const totalFeeValue = Object.values(feeMap).reduce((a, b) => a + b, 0) || 1;
  const feeBreakdown: FeeBreakdownItem[] = Object.entries(feeMap)
    .map(([name, value]) => ({ name, value, percentage: (value / totalFeeValue) * 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  const skuPerformance = Object.values(skuMap)
    .sort((a, b) => a.net - b.net)
    .slice(0, 50);

  const dailyTrend = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    transactions,
    summary,
    feeBreakdown,
    skuPerformance,
    dailyTrend,
    uploadedFiles,
  };
}

function emptySummary(): SummaryMetrics {
  return {
    grossSales: 0,
    netSales: 0,
    totalRefunds: 0,
    totalFees: 0,
    totalShipping: 0,
    totalTCS: 0,
    totalTDS: 0,
    totalAds: 0,
    netSettlement: 0,
    returnRate: 0,
    feePercentage: 0,
    transactionCount: 0,
    orderCount: 0,
    refundCount: 0,
    byPlatform: {
      amazon: {},
      meesho: {},
    },
  };
}

function emptyPartial() {
  return {
    grossSales: 0,
    totalRefunds: 0,
    totalFees: 0,
    totalShipping: 0,
    totalTCS: 0,
    totalTDS: 0,
    totalAds: 0,
    netSettlement: 0,
  };
}
