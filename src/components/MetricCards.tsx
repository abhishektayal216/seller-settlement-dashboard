import { SummaryMetrics } from '../types';
import { IndianRupee, TrendingDown, Percent, RotateCcw, Landmark, Receipt } from 'lucide-react';

interface Props {
  summary: SummaryMetrics;
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function MetricCards({ summary }: Props) {
  const cards = [
    {
      label: 'Gross Sales',
      value: formatINR(summary.grossSales),
      sub: `${summary.orderCount} orders`,
      icon: <IndianRupee size={20} />,
      color: 'green',
    },
    {
      label: 'Net Settlement',
      value: formatINR(summary.netSettlement),
      sub: 'Amount after all deductions',
      icon: <Landmark size={20} />,
      color: 'blue',
    },
    {
      label: 'Total Fees + Shipping',
      value: formatINR(summary.totalFees + summary.totalShipping),
      sub: `${summary.feePercentage.toFixed(1)}% of gross`,
      icon: <Receipt size={20} />,
      color: 'orange',
    },
    {
      label: 'Returns / Refunds',
      value: formatINR(summary.totalRefunds),
      sub: `${summary.returnRate.toFixed(1)}% return rate`,
      icon: <RotateCcw size={20} />,
      color: 'red',
    },
    {
      label: 'TCS (Reclaimable)',
      value: formatINR(summary.totalTCS),
      sub: 'Claim in GSTR-2B / ITR',
      icon: <Percent size={20} />,
      color: 'purple',
    },
    {
      label: 'TDS Deducted',
      value: formatINR(summary.totalTDS),
      sub: 'Appears in Form 26AS',
      icon: <TrendingDown size={20} />,
      color: 'gray',
    },
  ];

  return (
    <div className="metric-grid">
      {cards.map((c) => (
        <div key={c.label} className={`metric-card ${c.color}`}>
          <div className="metric-header">
            <span className="metric-icon">{c.icon}</span>
            <span className="metric-label">{c.label}</span>
          </div>
          <div className="metric-value">{c.value}</div>
          <div className="metric-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
