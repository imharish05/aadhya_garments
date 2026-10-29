import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Search, X } from 'lucide-react';

const PAY_STATUS = {
  PAID: 'bg-green-50 text-green-700',
  UNPAID: 'bg-yellow-50 text-yellow-700',
  REFUNDED: 'bg-gray-100 text-gray-500',
  FAILED: 'bg-red-50 text-red-500',
  PAYMENT_RECEIVED_STOCK_FAILED: 'bg-orange-50 text-orange-700'
};

const PaymentsAdminPage = () => {
  const [data, setData] = useState({ summary: [], refundedSummary: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const res = await api.get('/payments/admin/summary');
        if (res.data?.success) {
          setData({
            summary: res.data.summary || [],
            refundedSummary: res.data.refundedSummary || [],
            payments: res.data.payments || []
          });
        }
      } catch (err) {
        console.error('Failed to load payments summary:', err);
        toast.error(err.response?.data?.message || 'Error loading payments dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentData();
  }, []);

  // Compute metric cards separately for INR (Razorpay) and AED (Telr)
  const inrSummary = data.summary.find(s => s.currency === 'INR') || { totalRevenue: 0, transactionCount: 0 };
  const aedSummary = data.summary.find(s => s.currency === 'AED') || { totalRevenue: 0, transactionCount: 0 };

  const inrRefunded = data.refundedSummary.find(s => s.currency === 'INR')?.totalRefunded || 0;
  const aedRefunded = data.refundedSummary.find(s => s.currency === 'AED')?.totalRefunded || 0;

  const statCards = [
    {
      label: 'Total Collected (Razorpay)',
      value: `₹${inrSummary.totalRevenue.toLocaleString('en-IN')}`,
      sub: `${inrSummary.transactionCount} successful transactions`
    },
    {
      label: 'Total Refunded',
      value: `₹${inrRefunded.toLocaleString('en-IN')}`,
      sub: 'OOS or cancelled refunds'
    }
  ];

  // Filter transactions by Order ID / Order Number or Gateway Reference
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return data.payments;
    const q = searchQuery.trim().toLowerCase();
    return data.payments.filter(p => {
      const orderNoMatch = p.orderNo && String(p.orderNo).toLowerCase().includes(q);
      const idMatch = p.id && String(p.id).toLowerCase().includes(q);
      const refMatch = p.ref && String(p.ref).toLowerCase().includes(q);
      const customerMatch = (p.customerName && p.customerName.toLowerCase().includes(q)) ||
                            (p.customerEmail && p.customerEmail.toLowerCase().includes(q));
      return orderNoMatch || idMatch || refMatch || customerMatch;
    });
  }, [data.payments, searchQuery]);

  const handleExportToExcel = () => {
    try {
      const listToExport = filteredPayments;
      if (!listToExport || listToExport.length === 0) {
        toast.error('No transactions available to export');
        return;
      }

      const exportRows = listToExport.map((p, i) => ({
        'S.No': i + 1,
        'Order Number': p.orderNo,
        'Amount': p.currency === 'AED'
          ? `AED ${Number(p.amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
          : `₹${Number(p.amount).toLocaleString('en-IN')}`,
        'Currency': p.currency,
        'Payment Method': p.method,
        'Gateway Reference': p.ref,
        'Payment Status': p.status ? p.status.replace(/_/g, ' ') : '',
        'Customer Name': p.customerName || 'N/A',
        'Customer Email': p.customerEmail || 'N/A',
        'Date': new Date(p.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const colWidths = Object.keys(exportRows[0] || {}).map(key => ({
        wch: Math.max(key.length + 4, 18)
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

      const todayStr = new Date().toISOString().split('T')[0];
      const fileName = `TwinAApparels_Payments_${todayStr}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success(`Successfully exported ${exportRows.length} transactions to ${fileName}`);
    } catch (err) {
      console.error('Payments export error:', err);
      toast.error('Failed to export payments to Excel');
    }
  };

  return (
    <AdminLayout title="Payments">
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-gold"></div>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 max-w-xl gap-4 mb-6">
            {statCards.map(s => (
              <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-brand-grey text-xs mb-1">{s.label}</p>
                <p className="font-playfair text-2xl font-bold text-brand-text">{s.value}</p>
                <p className="text-xs text-brand-grey mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-brand-light flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search size={15} className="absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by Order ID or Gateway Ref..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg pl-9 pr-8 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition-all shadow-sm"
                    id="payment-search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <span className="text-xs text-brand-grey whitespace-nowrap">
                  {filteredPayments.length} of {data.payments.length}
                </span>
              </div>

              <button
                onClick={handleExportToExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all focus-visible:outline-emerald-600 cursor-pointer self-end sm:self-auto"
                id="export-payments"
                title="Export filtered transactions to Excel (.xlsx)"
              >
                <FileSpreadsheet size={14} />
                <span>Export to Excel</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Payments table">
                <thead>
                  <tr className="bg-brand-light/40 text-left">
                    {['Order', 'Amount', 'Method', 'Gateway Ref', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-grey uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-brand-grey text-xs">
                        {searchQuery ? `No transactions match "${searchQuery}".` : 'No transactions found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => (
                      <tr key={p.id} className="border-b border-brand-light hover:bg-brand-light/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-gold">{p.orderNo}</td>
                        <td className="px-4 py-3 font-semibold">
                          {p.currency === 'AED'
                            ? `AED ${p.amount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
                            : `₹${p.amount.toLocaleString('en-IN')}`}
                        </td>
                        <td className="px-4 py-3 text-brand-grey">{p.method}</td>
                        <td className="px-4 py-3 font-mono text-xs text-brand-grey">{p.ref}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${PAY_STATUS[p.status] || 'bg-gray-100'}`}>
                            {p.status ? p.status.replace(/_/g, ' ') : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-brand-grey text-xs">
                          {new Date(p.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default PaymentsAdminPage;
