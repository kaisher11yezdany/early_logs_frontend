import { useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';
import api from '../../api/axios';
import { format } from 'date-fns';

const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function ParentFees() {
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/fees/my/fees')
      .then(r => setFeeRecords(r.data.feeRecords || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (feeRecords.length === 0) return (
    <div className="space-y-5 fade-in">
      <div><h1 className="text-gray-800">Fee Details</h1></div>
      <div className="card flex flex-col items-center py-16 text-center">
        <IndianRupee className="w-12 h-12 text-gray-200 mb-3" />
        <h3 className="text-gray-500 font-semibold">No fee records yet</h3>
        <p className="text-gray-400 text-sm mt-1">Fee records will appear here once set up by the school.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-gray-800">Fee Details</h1>
        <p className="text-sm text-gray-400 mt-0.5">Payment history and balance</p>
      </div>

      {feeRecords.map(record => {
        const totalPaid = record.payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
        const balance   = Math.max(0, (record.totalAmount || 0) - totalPaid);
        const pct       = record.totalAmount > 0 ? Math.round((totalPaid / record.totalAmount) * 100) : 0;
        const allClear  = balance === 0 && totalPaid > 0;

        return (
          <div key={record._id} className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {record.student?.user?.name}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {record.student?.class?.name} – {record.student?.class?.section}
                  </span>
                </h2>
                <p className="text-xs text-gray-400">Academic Year: {record.academicYear}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${allClear ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {allClear ? '✓ All Cleared' : `Balance: ${fmt(balance)}`}
              </span>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card py-4 text-center">
                <p className="text-xl font-bold text-gray-800">{fmt(record.totalAmount)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total Fee</p>
              </div>
              <div className="card py-4 text-center border-l-4 border-green-500">
                <p className="text-xl font-bold text-green-600">{fmt(totalPaid)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Paid ({pct}%)</p>
              </div>
              <div className={`card py-4 text-center border-l-4 ${balance > 0 ? 'border-red-500' : 'border-green-500'}`}>
                <p className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(balance)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Balance Due</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="card py-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Payment Progress</span><span>{pct}% paid</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Payment history */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700">Payment History ({record.payments?.length || 0} entries)</h3>
              </div>
              {!record.payments?.length ? (
                <p className="text-center text-gray-400 py-8 text-sm">No payments recorded yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-500 font-semibold text-xs">#</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-semibold text-xs">Date</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-semibold text-xs">Amount</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-semibold text-xs hidden sm:table-cell">Mode</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-semibold text-xs hidden md:table-cell">Receipt</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-semibold text-xs hidden md:table-cell">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {record.payments.map((p, i) => (
                      <tr key={p._id || i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(p.amount)}</td>
                        <td className="px-4 py-3 text-gray-500 capitalize hidden sm:table-cell">{p.paymentMode?.replace('_',' ')}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">{p.receiptNo || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{p.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-xs font-bold text-gray-600">Total Paid</td>
                      <td className="px-4 py-2 text-right font-bold text-green-600">{fmt(totalPaid)}</td>
                      <td colSpan={3} className="hidden sm:table-cell" />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {balance > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                💬 Balance of <strong>{fmt(balance)}</strong> is pending. Please contact the school office to make the next payment.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
