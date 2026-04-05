import { useEffect, useState } from 'react';
import { CheckSquare, Calendar } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../api/axios';
import { format } from 'date-fns';

const STATUS_COLOR = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  leave: 'bg-blue-100 text-blue-700'
};

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/my/attendance', { params: { month, year } });
      setRecords(res.data.records || []);
      setStats(res.data.stats || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const attPct = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="My Attendance" subtitle="Track your attendance records" />

      {/* Month Filter */}
      <div className="card">
        <div className="flex gap-3">
          <select className="input-field w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Present', value: stats.present, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Absent', value: stats.absent, color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Late', value: stats.late, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Leave', value: stats.leave, color: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(s => (
          <div key={s.label} className={`card border p-4 text-center ${s.color}`}>
            <p className="text-3xl font-bold">{s.value || 0}</p>
            <p className="text-sm font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Percentage */}
      <div className="card flex items-center gap-4 py-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${attPct >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {attPct}%
        </div>
        <div>
          <p className="font-semibold text-gray-700">Overall Attendance: {attPct}%</p>
          <p className={`text-sm mt-0.5 ${attPct >= 75 ? 'text-green-600' : 'text-red-600'}`}>
            {attPct >= 75 ? '✅ Good standing – above 75% threshold' : '⚠️ Low attendance – below 75% threshold'}
          </p>
        </div>
      </div>

      {/* Records Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-gray-700">Attendance Records – {months[month - 1]} {year}</h3>
          </div>
          {records.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">No attendance records for this period</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">#</th>
                  <th className="table-header">Date</th>
                  <th className="table-header hidden sm:table-cell">Day</th>
                  <th className="table-header hidden sm:table-cell">Subject</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium text-gray-700">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">{format(new Date(r.date), 'EEEE')}</td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">{r.subject?.name || 'General'}</td>
                    <td className="table-cell">
                      <span className={`badge capitalize ${STATUS_COLOR[r.status] || 'badge-gray'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
