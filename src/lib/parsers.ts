import * as XLSX from 'xlsx';
import { ParsedTransaction, Platform } from '../types';

function cleanAmount(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[₹,\s]/g, '').replace(/[()]/g, m => (m === '(' ? '-' : ''));
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function detectPlatform(headers: string[]): Platform {
  const h = headers.map(x => x.toLowerCase().trim());
  if (h.some(x => x.includes('settlement-id') || x.includes('settlement id') || x.includes('amount-type') || x.includes('amount-description'))) {
    return 'amazon';
  }
  if (h.some(x => x.includes('sub-order') || x.includes('sub order') || x.includes('settlement amount') || x.includes('tcs amount'))) {
    return 'meesho';
  }
  if (h.some(x => x.includes('referral') || x.includes('fba') || x.includes('product sales'))) return 'amazon';
  if (h.some(x => x.includes('commission') && x.includes('shipping charge'))) return 'meesho';
  return 'unknown';
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s_-]+/g, ' ');
}

export function parseExcelFile(file: ArrayBuffer, fileName: string): { platform: Platform; transactions: ParsedTransaction[] } {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });

  if (json.length === 0) {
    return { platform: 'unknown', transactions: [] };
  }

  const headers = Object.keys(json[0]);
  const platform = detectPlatform(headers);

  if (platform === 'amazon') {
    return { platform, transactions: parseAmazon(json, fileName) };
  }
  if (platform === 'meesho') {
    return { platform, transactions: parseMeesho(json, fileName) };
  }

  const amazonTx = parseAmazon(json, fileName);
  if (amazonTx.length > 0) return { platform: 'amazon', transactions: amazonTx };
  const meeshoTx = parseMeesho(json, fileName);
  return { platform: meeshoTx.length > 0 ? 'meesho' : 'unknown', transactions: meeshoTx };
}

function parseAmazon(rows: any[], fileName: string): ParsedTransaction[] {
  const tx: ParsedTransaction[] = [];
  rows.forEach((row, idx) => {
    const keys = Object.keys(row);
    const norm: Record<string, any> = {};
    keys.forEach(k => { norm[normalizeHeader(k)] = row[k]; });

    const amountType = norm['amount type'] || norm['amount-type'] || '';
    const amountDesc = norm['amount description'] || norm['amount-description'] || norm['description'] || '';
    let amount = cleanAmount(norm['amount'] || norm['total'] || 0);

    const productSales = cleanAmount(norm['product sales'] || norm['product-sales']);
    const shippingCredits = cleanAmount(norm['shipping credits'] || norm['shipping-credits']);
    const sellingFees = cleanAmount(norm['selling fees'] || norm['selling-fees']);
    const fbaFees = cleanAmount(norm['fba fees'] || norm['fba-fees']);
    const otherFees = cleanAmount(norm['other transaction fees'] || norm['other-transaction-fees']);
    const total = cleanAmount(norm['total']);

    const orderId = String(norm['order id'] || norm['order-id'] || norm['amazon order id'] || '');
    const sku = String(norm['sku'] || '');
    const type = String(norm['type'] || amountType || 'Order');
    const dateRaw = norm['date/time'] || norm['posted date'] || norm['posted-date-time'] || norm['settlement start date'] || '';
    const date = parseDate(dateRaw);

    if (amount !== 0 || amountType) {
      const category = categorizeAmazon(amountType || type, amountDesc, amount);
      tx.push({
        id: `amz-${fileName}-${idx}`,
        platform: 'amazon',
        date,
        orderId: orderId || undefined,
        sku: sku || undefined,
        description: amountDesc || type,
        type: String(type || amountType),
        amount,
        category,
        raw: row,
      });
    } else if (productSales || sellingFees || fbaFees || total) {
      if (productSales) {
        tx.push({
          id: `amz-${fileName}-${idx}-sales`,
          platform: 'amazon',
          date,
          orderId: orderId || undefined,
          sku: sku || undefined,
          description: 'Product Sales',
          type: 'Order',
          amount: productSales,
          category: 'sales',
          raw: row,
        });
      }
      if (shippingCredits) {
        tx.push({
          id: `amz-${fileName}-${idx}-ship`,
          platform: 'amazon',
          date,
          orderId: orderId || undefined,
          sku: sku || undefined,
          description: 'Shipping Credits',
          type: 'Order',
          amount: shippingCredits,
          category: 'shipping',
          raw: row,
        });
      }
      if (sellingFees) {
        tx.push({
          id: `amz-${fileName}-${idx}-fee`,
          platform: 'amazon',
          date,
          orderId: orderId || undefined,
          sku: sku || undefined,
          description: 'Selling Fees / Referral',
          type: 'Fee',
          amount: -Math.abs(sellingFees),
          category: 'fee',
          raw: row,
        });
      }
      if (fbaFees) {
        tx.push({
          id: `amz-${fileName}-${idx}-fba`,
          platform: 'amazon',
          date,
          orderId: orderId || undefined,
          sku: sku || undefined,
          description: 'FBA Fees',
          type: 'Fee',
          amount: -Math.abs(fbaFees),
          category: 'fee',
          raw: row,
        });
      }
      if (otherFees) {
        tx.push({
          id: `amz-${fileName}-${idx}-other`,
          platform: 'amazon',
          date,
          orderId: orderId || undefined,
          sku: sku || undefined,
          description: 'Other Fees',
          type: 'Fee',
          amount: -Math.abs(otherFees),
          category: 'fee',
          raw: row,
        });
      }
    }
  });
  return tx;
}

function categorizeAmazon(type: string, desc: string, amount: number): ParsedTransaction['category'] {
  const t = (type + ' ' + desc).toLowerCase();
  if (t.includes('refund') || t.includes('return')) return 'refund';
  if (t.includes('tcs') || t.includes('tax collected') || t.includes('tds')) return 'tax';
  if (t.includes('shipping') || t.includes('weight handling') || t.includes('pick & pack')) return 'shipping';
  if (t.includes('advertising') || t.includes('sponsored') || t.includes('ad ')) return 'ad';
  if (t.includes('commission') || t.includes('referral') || t.includes('closing fee') || t.includes('fba') || t.includes('fee')) return 'fee';
  if (t.includes('order') || t.includes('product sales') || t.includes('principal') || amount > 0) return 'sales';
  return 'other';
}

function parseMeesho(rows: any[], fileName: string): ParsedTransaction[] {
  const tx: ParsedTransaction[] = [];
  rows.forEach((row, idx) => {
    const keys = Object.keys(row);
    const norm: Record<string, any> = {};
    keys.forEach(k => { norm[normalizeHeader(k)] = row[k]; });

    const subOrder = String(norm['sub order no'] || norm['sub-order id'] || norm['sub order id'] || norm['sub-order number'] || '');
    const orderId = String(norm['order id'] || norm['order no'] || subOrder);
    const sku = String(norm['sku'] || norm['supplier sku'] || '');
    const productPrice = cleanAmount(norm['product price'] || norm['sale amount'] || norm['selling price'] || norm['price']);
    const settlement = cleanAmount(norm['settlement amount'] || norm['net settlement'] || norm['net settlement amount'] || norm['settlement']);
    const commission = cleanAmount(norm['commission'] || norm['commission amount']);
    const shipping = cleanAmount(norm['shipping charge'] || norm['forward shipping'] || norm['shipping']);
    const returnShipping = cleanAmount(norm['return shipping charge'] || norm['return shipping'] || norm['reverse shipping']);
    const tcs = cleanAmount(norm['tcs amount'] || norm['tcs']);
    const tds = cleanAmount(norm['tds amount'] || norm['tds']);
    const dateRaw = norm['delivery date'] || norm['order date'] || norm['dispatch date'] || norm['settlement date'] || '';
    const date = parseDate(dateRaw);
    const txnType = String(norm['transaction type'] || norm['type'] || 'Forward');

    const isReturn = txnType.toLowerCase().includes('return') || txnType.toLowerCase().includes('rto') || settlement < 0;

    if (productPrice !== 0) {
      tx.push({
        id: `mee-${fileName}-${idx}-sales`,
        platform: 'meesho',
        date,
        orderId: orderId || subOrder || undefined,
        sku: sku || undefined,
        description: isReturn ? 'Return / RTO' : 'Product Sale',
        type: isReturn ? 'Refund' : 'Order',
        amount: isReturn ? -Math.abs(productPrice) : productPrice,
        category: isReturn ? 'refund' : 'sales',
        raw: row,
      });
    }

    if (commission !== 0) {
      tx.push({
        id: `mee-${fileName}-${idx}-comm`,
        platform: 'meesho',
        date,
        orderId: orderId || subOrder || undefined,
        sku: sku || undefined,
        description: 'Platform Commission',
        type: 'Fee',
        amount: -Math.abs(commission),
        category: 'fee',
        raw: row,
      });
    }

    if (shipping !== 0) {
      tx.push({
        id: `mee-${fileName}-${idx}-ship`,
        platform: 'meesho',
        date,
        orderId: orderId || subOrder || undefined,
        sku: sku || undefined,
        description: 'Forward Shipping',
        type: 'Fee',
        amount: -Math.abs(shipping),
        category: 'shipping',
        raw: row,
      });
    }

    if (returnShipping !== 0) {
      tx.push({
        id: `mee-${fileName}-${idx}-rship`,
        platform: 'meesho',
        date,
        orderId: orderId || subOrder || undefined,
        sku: sku || undefined,
        description: 'Return Shipping',
        type: 'Fee',
        amount: -Math.abs(returnShipping),
        category: 'shipping',
        raw: row,
      });
    }

    if (tcs !== 0) {
      tx.push({
        id: `mee-${fileName}-${idx}-tcs`,
        platform: 'meesho',
        date,
        orderId: orderId || subOrder || undefined,
        sku: sku || undefined,
        description: 'TCS (GST)',
        type: 'Tax',
        amount: -Math.abs(tcs),
        category: 'tax',
        raw: row,
      });
    }

    if (tds !== 0) {
      tx.push({
        id: `mee-${fileName}-${idx}-tds`,
        platform: 'meesho',
        date,
        orderId: orderId || subOrder || undefined,
        sku: sku || undefined,
        description: 'TDS (Income Tax)',
        type: 'Tax',
        amount: -Math.abs(tds),
        category: 'tax',
        raw: row,
      });
    }
  });
  return tx;
}

function parseDate(raw: any): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const str = String(raw).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 2000) {
      const dt = new Date(c, b - 1, a);
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
  }
  return new Date().toISOString().slice(0, 10);
}
