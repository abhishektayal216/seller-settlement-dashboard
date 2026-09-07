import { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface Props {
  onFilesParsed: (results: { platform: string; transactions: any[]; fileName: string }[]) => void;
  loading: boolean;
}

export function UploadZone({ onFilesParsed, loading }: Props) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const results: { platform: string; transactions: any[]; fileName: string }[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.match(/\.(xlsx|xls|csv|txt)$/i)) {
        setError('Please upload Excel (.xlsx/.xls) or CSV/TXT files only.');
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const { parseExcelFile } = await import('../lib/parsers');
        const { platform, transactions } = parseExcelFile(buffer, file.name);
        results.push({ platform, transactions, fileName: file.name });
      } catch (e: any) {
        setError(`Failed to parse ${file.name}: ${e.message || 'Unknown error'}`);
      }
    }
    if (results.length > 0) onFilesParsed(results);
  }, [onFilesParsed]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`upload-zone ${drag ? 'drag' : ''} ${loading ? 'loading' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        accept=".xlsx,.xls,.csv,.txt"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={loading}
      />
      <label htmlFor="file-upload" className="upload-label">
        <div className="upload-icon">
          {loading ? <div className="spinner" /> : <Upload size={40} />}
        </div>
        <h3>Upload Amazon or Meesho Settlement Reports</h3>
        <p>Drag & drop Excel / CSV files here, or click to browse</p>
        <p className="hint">Supports multiple files • Amazon Flat File V2 / Date Range • Meesho Payment Statement</p>
      </label>
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}
