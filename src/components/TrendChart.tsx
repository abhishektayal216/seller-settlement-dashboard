import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: { date: string; sales: number; settlement: number; fees: number }[];
}

export function TrendChart({ data }: Props) {
  if (!data.length) return <div className="empty-chart">No trend data</div>;

  const formatted = data.map(d => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="chart-card">
      <h3>Daily Sales vs Settlement</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
            }
          />
          <Legend />
          <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" fill="#10b98133" />
          <Area type="monotone" dataKey="settlement" name="Net Settlement" stroke="#3b82f6" fill="#3b82f633" />
          <Area type="monotone" dataKey="fees" name="Fees" stroke="#f59e0b" fill="#f59e0b33" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
