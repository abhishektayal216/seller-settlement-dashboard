import { SkuPerformance } from '../types';

interface Props {
  data: SkuPerformance[];
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function SkuTable({ data }: Props) {
  if (!data.length) return null;

  return (
    <div className="table-card">
      <h3>SKU Performance (lowest net first — watch these)</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Sales</th>
              <th>Refunds</th>
              <th>Fees</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((s) => (
              <tr key={s.sku} className={s.net < 0 ? 'negative' : ''}>
                <td className="sku">{s.sku}</td>
                <td>{formatINR(s.sales)}</td>
                <td>{formatINR(s.refunds)}</td>
                <td>{formatINR(s.fees)}</td>
                <td className={s.net < 0 ? 'neg' : 'pos'}>{formatINR(s.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
