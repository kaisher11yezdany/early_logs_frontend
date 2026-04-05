import { useEffect, useState } from 'react';
import { DollarSign, Download } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import { format } from 'date-fns';

const STATUS_BADGE = { paid: 'badge-green', pending: 'badge-yellow', partial: 'badge-blue', overdue: 'badge-red' };

export default function ParentFees() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fees/my/fees')
      .then(r => setPayments(r.data.payments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.paidAmount || 0), 0);
  const totalDue = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.dueAmount || 0), 0);

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Fee Details" subtitle="Track fee payments and dues" />

      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center py-5 border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Total Paid</p>
        </div>
        <div className="card text-center py-5 border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">₹{totalDue.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">Total Due</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : payments.length === 0 ? (
        <div className="card"><EmptyState title="No fee records found" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-gray-700">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Month</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header hidden sm:table-cell">Mode</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden md:table-cell">Receipt</th>
                  <th className="table-header hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-700">{p.month || '—'}</td>
                    <td className="table-cell font-semibold text-gray-800">₹{(p.paidAmount || p.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="table-cell hidden sm:table-cell capitalize text-gray-500">{p.paymentMode}</td>
                    <td className="table-cell"><span className={`badge ${STATUS_BADGE[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                    <td className="table-cell hidden md:table-cell font-mono text-xs text-gray-500">{p.receiptNo || '—'}</td>
                    <td className="table-cell hidden md:table-cell text-xs text-gray-500">
                      {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
