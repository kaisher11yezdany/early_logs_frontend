import { useEffect, useState } from 'react';
import { FileText, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import { format } from 'date-fns';

const GRADE_COLOR = { 'A+': 'text-green-600', A: 'text-green-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-orange-600', F: 'text-red-600' };

export default function MyExams() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exams/my/results')
      .then(r => setResults(r.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const avg = results.length
    ? Math.round(results.filter(r => r.marksObtained != null).reduce((s, r) => s + (r.marksObtained / r.totalMarks) * 100, 0) / results.filter(r => r.marksObtained != null).length)
    : 0;

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Exams & Results" subtitle="View your exam performance" />

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-800">{results.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Exams</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-green-600">{results.filter(r => r.marksObtained >= (r.passingMarks || 0)).length}</p>
          <p className="text-xs text-gray-500 mt-1">Passed</p>
        </div>
        <div className="card text-center py-4">
          <p className={`text-2xl font-bold ${avg >= 60 ? 'text-green-600' : avg >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{avg}%</p>
          <p className="text-xs text-gray-500 mt-1">Average</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : results.length === 0 ? (
        <div className="card"><EmptyState title="No exam results yet" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Exam</th>
                <th className="table-header hidden sm:table-cell">Type</th>
                <th className="table-header">Subject</th>
                <th className="table-header hidden md:table-cell">Date</th>
                <th className="table-header text-center">Marks</th>
                <th className="table-header text-center">Grade</th>
                <th className="table-header hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.map(r => {
                const passed = r.marksObtained >= (r.passingMarks || 0);
                const pct = r.marksObtained != null ? Math.round((r.marksObtained / r.totalMarks) * 100) : null;
                return (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-800">{r.title}</td>
                    <td className="table-cell hidden sm:table-cell"><span className="badge badge-gray capitalize">{r.type?.replace('_', ' ')}</span></td>
                    <td className="table-cell text-gray-500">{r.subject?.name}</td>
                    <td className="table-cell hidden md:table-cell text-gray-500 text-xs">{format(new Date(r.examDate), 'dd MMM yyyy')}</td>
                    <td className="table-cell text-center">
                      {r.isAbsent ? <span className="badge badge-red">Absent</span> :
                        r.marksObtained != null ? <span className="font-semibold">{r.marksObtained}/{r.totalMarks}</span> : '—'}
                    </td>
                    <td className="table-cell text-center font-bold">
                      <span className={GRADE_COLOR[r.grade] || 'text-gray-500'}>{r.grade || '—'}</span>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      {r.marksObtained != null && !r.isAbsent &&
                        <span className={`badge ${passed ? 'badge-green' : 'badge-red'}`}>{passed ? 'Pass' : 'Fail'}</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
