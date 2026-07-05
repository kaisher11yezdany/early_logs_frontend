import { useState, useRef } from 'react';
import { X, Upload, Download, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── CSV template columns ───────────────────────────────────────────────────────
const TEMPLATE_HEADERS = [
  // Admission
  'admissionNo', 'academicYear', 'className', 'section', 'rollNo', 'admissionDate',
  // Login
  'name', 'email', 'password', 'phone',
  // Student identity
  'dateOfBirth', 'gender', 'bloodGroup', 'caste', 'category',
  'religion', 'nationality', 'placeOfBirth', 'aadharNo', 'language',
  // Current address
  'currentStreet', 'currentCity', 'currentState', 'currentPincode',
  // Permanent address
  'permanentStreet', 'permanentCity', 'permanentState', 'permanentPincode',
  // Father
  'fatherName', 'fatherQualification', 'fatherOccupation', 'fatherAadhar', 'fatherPhone', 'fatherEmail',
  // Mother
  'motherName', 'motherQualification', 'motherOccupation', 'motherAadhar', 'motherPhone', 'motherEmail',
  // Guardian (optional)
  'guardianName', 'guardianRelation', 'guardianAadharNo', 'guardianPhone',
  // Previous school
  'prevSchoolName', 'prevStandard', 'prevTransferNoDate', 'prevProgress',
  'prevDateOfLeaving', 'prevTcNoDate', 'prevPenNo', 'prevSatsNo', 'prevApparId', 'prevUdiseCode',
];

const SAMPLE_ROWS = [
  [
    '2026/001', '2025-2026', 'Grade 1', 'A', '01', '2026-06-01',
    'Aarav Sharma', 'aarav@example.com', '', '9876543210',
    '2015-06-15', 'male', 'O+', 'Brahmin', 'General', 'Hindu', 'Indian', 'Bengaluru', '123456789012', 'Kannada',
    '12 MG Road', 'Bengaluru', 'Karnataka', '560001',
    '12 MG Road', 'Bengaluru', 'Karnataka', '560001',
    'Rajesh Sharma', 'Graduate', 'Engineer', '234567890123', '9876543211', 'rajesh@example.com',
    'Priya Sharma', '12th', 'Homemaker', '345678901234', '9876543212', 'priya@example.com',
    '', '', '', '',
    'St. Mary School', 'Class 5', 'TC/2024/001', 'Promoted', '2025-03-31', 'TC/001', 'PEN001', 'SATS001', 'APP001', 'UDISE001',
  ],
  [
    '2026/002', '2025-2026', 'Grade 2', 'B', '02', '2026-06-01',
    'Meera Nair', 'meera@example.com', '', '9876543220',
    '2014-03-22', 'female', 'A+', 'Nair', 'OBC', 'Hindu', 'Indian', 'Kochi', '456789012345', 'Malayalam',
    '5 Beach Road', 'Kochi', 'Kerala', '682001',
    '5 Beach Road', 'Kochi', 'Kerala', '682001',
    'Suresh Nair', 'Post Graduate', 'Doctor', '567890123456', '9876543221', 'suresh@example.com',
    'Latha Nair', 'Graduate', 'Teacher', '678901234567', '9876543222', 'latha@example.com',
    '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
  ],
];

const REQUIRED = ['admissionNo', 'name', 'email'];

// ── Simple CSV parser (handles quoted fields) ──────────────────────────────────
function parseCSVLine(line) {
  const vals = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === ',' && !inQ) { vals.push(cur); cur = ''; }
    else { cur += line[i]; }
  }
  vals.push(cur);
  return vals.map(v => v.trim());
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(','), ...SAMPLE_ROWS.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'student_import_template.csv';
  a.click();
}

function validate(row) {
  const missing = REQUIRED.filter(f => !row[f]?.trim());
  return missing.length ? `Missing: ${missing.join(', ')}` : null;
}

// ── Status badge ───────────────────────────────────────────────────────────────
function Badge({ ok, label }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />{label}</span>
    : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />{label}</span>;
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function BulkImportModal({ onClose, onSuccess }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});   // index → error string
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const { rows: parsed } = parseCSV(e.target.result);
      const errs = {};
      parsed.forEach((r, i) => { const e = validate(r); if (e) errs[i] = e; });
      setRows(parsed);
      setErrors(errs);
      setResults(null);
    };
    reader.readAsText(file);
  };

  const onFileInput = e => processFile(e.target.files[0]);
  const onDrop = e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); };

  const validRows   = rows.filter((_, i) => !errors[i]);
  const invalidRows = rows.filter((_, i) =>  errors[i]);

  const handleImport = async () => {
    if (validRows.length === 0) { toast.error('No valid rows to import'); return; }
    setImporting(true);
    try {
      const res = await api.post('/students/bulk', { students: validRows });
      setResults(res.data.results);
      const ok = res.data.results.filter(r => r.success).length;
      toast.success(`${ok} student${ok !== 1 ? 's' : ''} imported successfully`);
      if (ok > 0) onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Bulk Import Students</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a CSV file to enroll multiple students at once</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
              <Download className="w-4 h-4" /> Download Template
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Drop zone */}
          {!results && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
                ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-3 ${dragOver ? 'text-blue-500' : 'text-gray-300'}`} />
              <p className="text-sm font-medium text-gray-600">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Only .csv files · Required columns: admissionNo, name, email</p>
              <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={onFileInput} />
            </div>
          )}

          {/* Stats bar */}
          {rows.length > 0 && !results && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm">
              <span className="text-gray-500">Total: <strong className="text-gray-800">{rows.length}</strong></span>
              <span className="text-green-600">Valid: <strong>{validRows.length}</strong></span>
              {invalidRows.length > 0 && <span className="text-red-500">Invalid: <strong>{invalidRows.length}</strong></span>}
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1 text-amber-600 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" /> Invalid rows will be skipped
                </span>
              )}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !results && (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold w-8">#</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Status</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Admission No</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Name</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Email</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Class</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Gender</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Issue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r, i) => (
                    <tr key={i} className={errors[i] ? 'bg-red-50/40' : ''}>
                      <td className="px-3 py-2 text-gray-400">{i + 2}</td>
                      <td className="px-3 py-2"><Badge ok={!errors[i]} label={errors[i] ? 'Invalid' : 'Valid'} /></td>
                      <td className="px-3 py-2 font-mono text-gray-700">{r.admissionNo || '—'}</td>
                      <td className="px-3 py-2 text-gray-800 font-medium">{r.name || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{r.className}{r.section ? ` - ${r.section}` : ''}</td>
                      <td className="px-3 py-2 capitalize text-gray-500">{r.gender || '—'}</td>
                      <td className="px-3 py-2 text-red-500">{errors[i] || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Results after import */}
          {results && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-700">{results.filter(r => r.success).length}</p>
                  <p className="text-sm text-green-600 mt-1">Imported Successfully</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-xl p-4 text-center border border-red-100">
                  <p className="text-2xl font-bold text-red-600">{results.filter(r => !r.success).length}</p>
                  <p className="text-sm text-red-500 mt-1">Failed</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">Row</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">Status</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">Admission No</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">Name</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((r, i) => (
                      <tr key={i} className={r.success ? '' : 'bg-red-50/40'}>
                        <td className="px-3 py-2 text-gray-400">{r.row}</td>
                        <td className="px-3 py-2"><Badge ok={r.success} label={r.success ? 'Imported' : 'Failed'} /></td>
                        <td className="px-3 py-2 font-mono text-gray-700">{r.admissionNo}</td>
                        <td className="px-3 py-2 text-gray-800">{r.name || '—'}</td>
                        <td className="px-3 py-2 text-red-500">{r.error || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 shrink-0 flex items-center justify-between">
          {!results ? (
            <>
              <p className="text-xs text-gray-400">
                {rows.length > 0
                  ? `${validRows.length} of ${rows.length} rows ready to import`
                  : 'No file loaded yet'}
              </p>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {importing
                    ? <><Loader className="w-4 h-4 animate-spin" /> Importing…</>
                    : <><Upload className="w-4 h-4" /> Import {validRows.length} Students</>
                  }
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400">Import complete</p>
              <button onClick={onClose} className="btn-primary">Done</button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
