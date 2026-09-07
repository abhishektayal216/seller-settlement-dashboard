import { useState, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { MetricCards } from './components/MetricCards';
import { FeeChart } from './components/FeeChart';
import { TrendChart } from './components/TrendChart';
import { SkuTable } from './components/SkuTable';
import { parseExcelFile } from './lib/parsers';
import { computeDashboard } from './lib/metrics';
import { DashboardData, ParsedTransaction } from './types';
import { BarChart3, Trash2, FileText } from 'lucide-react';
import './App.css';

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [allTx, setAllTx] = useState<ParsedTransaction[]>([]);
  const [filesMeta, setFilesMeta] = useState<{ name: string; platform: string; rows: number }[]>([]);

  const handleFiles = useCallback(async (results: { platform: string; transactions: ParsedTransaction[]; fileName: string }[]) => {
    setLoading(true);
    try {
      const newTx = [...allTx];
      const newMeta = [...filesMeta];
      for (const r of results) {
        newTx.push(...r.transactions);
        newMeta.push({ name: r.fileName, platform: r.platform, rows: r.transactions.length });
      }
      setAllTx(newTx);
      setFilesMeta(newMeta);
      const dashboard = computeDashboard(newTx, newMeta as any);
      setData(dashboard);
    } finally {
      setLoading(false);
    }
  }, [allTx, filesMeta]);

  const clearAll = () => {
    setData(null);
    setAllTx([]);
    setFilesMeta([]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <BarChart3 size={28} />
          <div>
            <h1>Seller Settlement Dashboard</h1>
            <p>Amazon + Meesho month-end reports → clear numbers</p>
          </div>
        </div>
        {data && (
          <button className="btn-clear" onClick={clearAll}>
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </header>

      <main>
        {!data && (
          <UploadZone onFilesParsed={handleFiles} loading={loading} />
        )}

        {data && (
          <>
            <section className="files-info">
              <FileText size={16} />
              <span>
                {filesMeta.map(f => `${f.name} (${f.platform}, ${f.rows} rows)`).join(' · ')}
              </span>
              <button className="btn-link" onClick={() => document.getElementById('file-upload')?.click()}>
                + Add more files
              </button>
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".xlsx,.xls,.csv,.txt"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  if (!e.target.files) return;
                  setLoading(true);
                  const results = [];
                  for (const file of Array.from(e.target.files)) {
                    const buffer = await file.arrayBuffer();
                    const { platform, transactions } = parseExcelFile(buffer, file.name);
                    results.push({ platform, transactions, fileName: file.name });
                  }
                  handleFiles(results);
                }}
              />
            </section>

            <MetricCards summary={data.summary} />

            <div className="charts-row">
              <FeeChart data={data.feeBreakdown} />
              <TrendChart data={data.dailyTrend} />
            </div>

            <SkuTable data={data.skuPerformance} />

            <section className="tips">
              <h3>Seller Tips</h3>
              <ul>
                <li><strong>TCS</strong> is reclaimable — match with GSTR-2B and claim ITC.</li>
                <li><strong>TDS (0.1%)</strong> appears in Form 26AS; claim while filing ITR.</li>
                <li>High return rate or high fee % on a SKU? Review pricing or listing quality.</li>
                <li>Net Settlement should roughly match the amount credited to your bank for the period.</li>
              </ul>
            </section>
          </>
        )}
      </main>

      <footer>
        <p>Built for solo sellers · All processing happens in your browser · No data leaves your device</p>
      </footer>
    </div>
  );
}

export default App;
