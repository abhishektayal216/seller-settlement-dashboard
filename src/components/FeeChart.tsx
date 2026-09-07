import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FeeBreakdownItem } from '../types';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

interface Props {
  data: FeeBreakdownItem[];
}

export function FeeChart({ data }: Props) {
  if (!data.length) return <div className="empty-chart">No fee data</div>;

  return (
    <div className="chart-card">
      <h3>Fee Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, percentage }) => `${name.slice(0, 12)} ${percentage.toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
