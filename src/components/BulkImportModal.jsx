import { useState, useRef } from 'react';
import { X, Upload, Download, CheckCircle, XCircle, AlertTriangle, Loader, ArrowRight, ArrowLeft, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── System fields definition ───────────────────────────────────────────────────
const SYSTEM_FIELDS = [
  // Required
  { key: 'admissionNo',          label: 'Admission No',          required: true },
  { key: 'name',                 label: 'Student Name',          required: true },
  { key: 'email',                label: 'Email',                 group: 'Personal' },
  // Academic
  { key: 'academicYear',         label: 'Academic Year',         group: 'Academic' },
  { key: 'className',            label: 'Class Name',            group: 'Academic' },
  { key: 'section',              label: 'Section',               group: 'Academic' },
  { key: 'rollNo',               label: 'Roll No',               group: 'Academic' },
  { key: 'admissionDate',        label: 'Admission Date',        group: 'Academic' },
  // Personal
  { key: 'phone',                label: 'Phone',                 group: 'Personal' },
  { key: 'dateOfBirth',          label: 'Date of Birth',         group: 'Personal' },
  { key: 'gender',               label: 'Gender',                group: 'Personal' },
  { key: 'bloodGroup',           label: 'Blood Group',           group: 'Personal' },
  { key: 'caste',                label: 'Caste',                 group: 'Personal' },
  { key: 'category',             label: 'Category',              group: 'Personal' },
  { key: 'religion',             label: 'Religion',              group: 'Personal' },
  { key: 'nationality',          label: 'Nationality',           group: 'Personal' },
  { key: 'placeOfBirth',         label: 'Place of Birth',        group: 'Personal' },
  { key: 'aadharNo',             label: 'Aadhar No',             group: 'Personal' },
  { key: 'language',             label: 'Language',              group: 'Personal' },
  // Address
  { key: 'currentStreet',        label: 'Street (Current)',      group: 'Address' },
  { key: 'currentCity',          label: 'City (Current)',        group: 'Address' },
  { key: 'currentState',         label: 'State (Current)',       group: 'Address' },
  { key: 'currentPincode',       label: 'Pincode (Current)',     group: 'Address' },
  { key: 'permanentStreet',      label: 'Street (Permanent)',    group: 'Address' },
  { key: 'permanentCity',        label: 'City (Permanent)',      group: 'Address' },
  { key: 'permanentState',       label: 'State (Permanent)',     group: 'Address' },
  { key: 'permanentPincode',     label: 'Pincode (Permanent)',   group: 'Address' },
  // Father
  { key: 'fatherName',           label: "Father's Name",         group: 'Father' },
  { key: 'fatherQualification',  label: "Father's Qualification",group: 'Father' },
  { key: 'fatherOccupation',     label: "Father's Occupation",   group: 'Father' },
  { key: 'fatherAadhar',         label: "Father's Aadhar",       group: 'Father' },
  { key: 'fatherPhone',          label: "Father's Phone",        group: 'Father' },
  { key: 'fatherEmail',          label: "Father's Email",        group: 'Father' },
  // Mother
  { key: 'motherName',           label: "Mother's Name",         group: 'Mother' },
  { key: 'motherQualification',  label: "Mother's Qualification",group: 'Mother' },
  { key: 'motherOccupation',     label: "Mother's Occupation",   group: 'Mother' },
  { key: 'motherAadhar',         label: "Mother's Aadhar",       group: 'Mother' },
  { key: 'motherPhone',          label: "Mother's Phone",        group: 'Mother' },
  { key: 'motherEmail',          label: "Mother's Email",        group: 'Mother' },
  // Guardian
  { key: 'guardianName',         label: "Guardian's Name",       group: 'Guardian' },
  { key: 'guardianRelation',     label: "Guardian's Relation",   group: 'Guardian' },
  { key: 'guardianAadharNo',     label: "Guardian's Aadhar",     group: 'Guardian' },
  { key: 'guardianPhone',        label: "Guardian's Phone",      group: 'Guardian' },
  // Previous school
  { key: 'prevSchoolName',       label: 'Previous School',       group: 'Previous School' },
  { key: 'prevStandard',         label: 'Previous Standard',     group: 'Previous School' },
  { key: 'prevTransferNoDate',   label: 'Transfer No / Date',    group: 'Previous School' },
  { key: 'prevProgress',         label: 'Progress',              group: 'Previous School' },
  { key: 'prevDateOfLeaving',    label: 'Date of Leaving',       group: 'Previous School' },
  { key: 'prevTcNoDate',         label: 'TC No / Date',          group: 'Previous School' },
  { key: 'prevPenNo',            label: 'PEN No',                group: 'Previous School' },
  { key: 'prevSatsNo',           label: 'SATS No',               group: 'Previous School' },
  { key: 'prevApparId',          label: 'APPAR ID',              group: 'Previous School' },
  { key: 'prevUdiseCode',        label: 'UDISE Code',            group: 'Previous School' },
];

const REQUIRED_KEYS = ['admissionNo', 'name'];

// Aliases for auto-detection (lowercase)
const ALIASES = {
  admissionNo:        ['admission no', 'admno', 'adm no', 'adm_no', 'admissionnumber', 'admission number', 'adm.no', 'adm no.'],
  name:               ['student name', 'full name', 'fullname', 'studentname', 'student_name', 'pupil name'],
  email:              ['email address', 'emailaddress', 'email_address', 'student email', 'mail'],
  phone:              ['mobile', 'mobile no', 'phoneno', 'mobileno', 'contact', 'contact no', 'phone no', 'mobile number', 'phone number'],
  className:          ['class', 'grade', 'standard', 'class name', 'classname', 'std'],
  section:            ['sec', 'div', 'division'],
  rollNo:             ['roll', 'roll no', 'rollno', 'roll number'],
  academicYear:       ['academic year', 'year', 'session'],
  admissionDate:      ['admission date', 'date of admission', 'joining date'],
  dateOfBirth:        ['dob', 'date of birth', 'birth date', 'birthdate', 'd.o.b'],
  gender:             ['sex'],
  bloodGroup:         ['blood', 'blood group', 'bloodgroup', 'bg'],
  aadharNo:           ['aadhar', 'aadhaar', 'aadhar no', 'aadhaar no', 'aadhar number'],
  fatherName:         ["father name", "father's name", "fathers name", "f name"],
  fatherPhone:        ["father mobile", "father phone", "father contact", "fathers mobile", "father's phone"],
  fatherEmail:        ["father email", "father's email", "fathers email"],
  fatherOccupation:   ["father occupation", "father's occupation", "fathers occupation"],
  motherName:         ["mother name", "mother's name", "mothers name", "m name"],
  motherPhone:        ["mother mobile", "mother phone", "mother contact", "mothers mobile", "mother's phone"],
  motherEmail:        ["mother email", "mother's email", "mothers email"],
  motherOccupation:   ["mother occupation", "mother's occupation", "mothers occupation"],
  currentCity:        ['city', 'town'],
  currentState:       ['state'],
  currentPincode:     ['pincode', 'pin', 'zip', 'postal code'],
  currentStreet:      ['address', 'street', 'locality', 'area'],
};

// ── CSV parser ─────────────────────────────────────────────────────────────────
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

// ── Auto-detect mapping ────────────────────────────────────────────────────────
function autoDetect(csvHeaders) {
  const mapping = {};
  const usedCsvCols = new Set();
  SYSTEM_FIELDS.forEach(field => {
    const candidates = [field.key.toLowerCase(), ...(ALIASES[field.key] || [])];
    const match = csvHeaders.find(h => candidates.includes(h.toLowerCase().trim()) && !usedCsvCols.has(h));
    if (match) { mapping[field.key] = match; usedCsvCols.add(match); }
    else mapping[field.key] = '';
  });
  return mapping;
}

// Apply field mapping to raw CSV rows
function applyMapping(rawRows, mapping) {
  return rawRows.map(row => {
    const obj = {};
    SYSTEM_FIELDS.forEach(({ key }) => {
      const col = mapping[key];
      obj[key] = col ? (row[col] || '') : '';
    });
    return obj;
  });
}

// ── Template download ──────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = SYSTEM_FIELDS.map(f => f.key);
const SAMPLE_ROWS = [
  ['2026/001','2025-2026','Grade 1','A','01','2026-06-01','Aarav Sharma','aarav@example.com','','9876543210','2015-06-15','male','O+','Brahmin','General','Hindu','Indian','Bengaluru','123456789012','Kannada','12 MG Road','Bengaluru','Karnataka','560001','12 MG Road','Bengaluru','Karnataka','560001','Rajesh Sharma','Graduate','Engineer','234567890123','9876543211','rajesh@example.com','Priya Sharma','12th','Homemaker','345678901234','9876543212','priya@example.com','','','','','St. Mary School','Class 5','TC/2024/001','Promoted','2025-03-31','TC/001','PEN001','SATS001','APP001','UDISE001'],
  ['2026/002','2025-2026','Grade 2','B','02','2026-06-01','Meera Nair','meera@example.com','','9876543220','2014-03-22','female','A+','Nair','OBC','Hindu','Indian','Kochi','456789012345','Malayalam','5 Beach Road','Kochi','Kerala','682001','5 Beach Road','Kochi','Kerala','682001','Suresh Nair','Post Graduate','Doctor','567890123456','9876543221','suresh@example.com','Latha Nair','Graduate','Teacher','678901234567','9876543222','latha@example.com','','','','','','','','','','','','','',''],
];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(','), ...SAMPLE_ROWS.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'student_import_template.csv';
  a.click();
}

// ── Badge ──────────────────────────────────────────────────────────────────────
function Badge({ ok, label }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />{label}</span>
    : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />{label}</span>;
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Upload', 'Map Fields', 'Preview & Import'];
  return (
    <div className="flex items-center gap-0 shrink-0">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition
            ${i === current ? 'bg-blue-600 text-white' : i < current ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {i < current ? <CheckCircle className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full border-2 inline-flex items-center justify-center text-[10px]">{i + 1}</span>}
            {s}
          </div>
          {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ── Mapping step ───────────────────────────────────────────────────────────────
const GROUPS = ['Academic', 'Personal', 'Address', 'Father', 'Mother', 'Guardian', 'Previous School'];

function MappingStep({ csvHeaders, mapping, onChange }) {
  const [openGroups, setOpenGroups] = useState(['Academic', 'Personal']);
  const toggleGroup = g => setOpenGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
  const mappedCount    = Object.values(mapping).filter(Boolean).length;

  const SelectCol = ({ fieldKey }) => (
    <select
      value={mapping[fieldKey] || ''}
      onChange={e => onChange({ ...mapping, [fieldKey]: e.target.value })}
      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700
                 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      <option value="">(not mapped)</option>
      {csvHeaders.map(h => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  );

  return (
    <div className="space-y-4">
      {/* Info bar */}
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm">
        <p className="text-blue-700">
          <span className="font-bold">{csvHeaders.length}</span> columns in your file ·{' '}
          <span className="font-bold text-green-700">{mappedCount}</span> fields matched
        </p>
        <button
          onClick={() => onChange(autoDetect(csvHeaders))}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
        >
          <Wand2 className="w-3.5 h-3.5" /> Re-run Auto-detect
        </button>
      </div>

      {/* Required fields */}
      <div className="rounded-xl border border-red-100 overflow-hidden">
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          <p className="text-xs font-bold text-red-700">Required Fields</p>
        </div>
        <div className="divide-y divide-gray-50">
          {requiredFields.map(field => (
            <div key={field.key} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-36 shrink-0">
                <span className="text-xs font-semibold text-gray-700">{field.label}</span>
                <span className="ml-1 text-red-500 text-xs">*</span>
              </div>
              <div className="flex-1"><SelectCol fieldKey={field.key} /></div>
              <div className="w-6 shrink-0 text-center">
                {mapping[field.key]
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional fields by group */}
      {GROUPS.map(group => {
        const fields = SYSTEM_FIELDS.filter(f => f.group === group);
        const isOpen = openGroups.includes(group);
        const mapped = fields.filter(f => mapping[f.key]).length;
        return (
          <div key={group} className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-left"
              onClick={() => toggleGroup(group)}
            >
              <span className="text-xs font-bold text-gray-600">{group}</span>
              <div className="flex items-center gap-2">
                {mapped > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{mapped} mapped</span>
                )}
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
              </div>
            </button>
            {isOpen && (
              <div className="divide-y divide-gray-50">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center gap-3 px-4 py-2">
                    <div className="w-44 shrink-0">
                      <span className="text-xs text-gray-600">{field.label}</span>
                    </div>
                    <div className="flex-1"><SelectCol fieldKey={field.key} /></div>
                    <div className="w-6 shrink-0 text-center">
                      {mapping[field.key] && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function BulkImportModal({ onClose, onSuccess }) {
  const [step, setStep]         = useState(0); // 0=upload, 1=map, 2=preview
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [rawRows, setRawRows]   = useState([]);
  const [mapping, setMapping]   = useState({});
  const [mappedRows, setMappedRows] = useState([]);
  const [errors, setErrors]     = useState({});
  const [importing, setImporting] = useState(false);
  const [results, setResults]   = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const validate = row => {
    const missing = REQUIRED_KEYS.filter(f => !row[f]?.trim());
    return missing.length ? `Missing: ${missing.join(', ')}` : null;
  };

  const processFile = file => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const { headers, rows } = parseCSV(e.target.result);
      if (!headers.length) { toast.error('Could not parse CSV — check the file format'); return; }
      setCsvHeaders(headers);
      setRawRows(rows);
      const detected = autoDetect(headers);
      setMapping(detected);
      setStep(1);
    };
    reader.readAsText(file);
  };

  const onFileInput = e => processFile(e.target.files[0]);
  const onDrop = e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); };

  const confirmMapping = () => {
    const rows = applyMapping(rawRows, mapping);
    const errs = {};
    rows.forEach((r, i) => { const e = validate(r); if (e) errs[i] = e; });
    setMappedRows(rows);
    setErrors(errs);
    setResults(null);
    setStep(2);
  };

  const requiredMapped = REQUIRED_KEYS.every(k => mapping[k]);
  const validRows   = mappedRows.filter((_, i) => !errors[i]);
  const invalidRows = mappedRows.filter((_, i) =>  errors[i]);

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">Bulk Import Students</h2>
            <p className="text-xs text-gray-400 mt-0.5">Map your ERP CSV columns to system fields</p>
          </div>
          <div className="flex items-center gap-3">
            <Steps current={step} />
            <button onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition">
              <Download className="w-3.5 h-3.5" /> Template
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Step 0: Upload ── */}
          {step === 0 && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition
                ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-blue-500' : 'text-gray-300'}`} />
              <p className="text-sm font-semibold text-gray-600 mb-1">Drop your ERP CSV file here or click to browse</p>
              <p className="text-xs text-gray-400">Any column names are accepted — you'll map them in the next step</p>
              <input ref={fileRef} type="file" accept=".csv" className="sr-only" onChange={onFileInput} />
            </div>
          )}

          {/* ── Step 1: Map ── */}
          {step === 1 && (
            <MappingStep csvHeaders={csvHeaders} mapping={mapping} onChange={setMapping} />
          )}

          {/* ── Step 2: Preview / Results ── */}
          {step === 2 && (
            <>
              {/* Stats bar */}
              {!results && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm">
                  <span className="text-gray-500">Total: <strong className="text-gray-800">{mappedRows.length}</strong></span>
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
              {!results && (
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
                      {mappedRows.map((r, i) => (
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

              {/* Results */}
              {results && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-green-50 rounded-xl p-4 text-center border border-green-100">
                      <p className="text-2xl font-bold text-green-700">{results.filter(r => r.success && !r.updated).length}</p>
                      <p className="text-sm text-green-600 mt-1">Created</p>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                      <p className="text-2xl font-bold text-blue-700">{results.filter(r => r.success && r.updated).length}</p>
                      <p className="text-sm text-blue-600 mt-1">Updated</p>
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
                            <td className="px-3 py-2">
                              {r.success
                                ? r.updated
                                  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Updated</span>
                                  : <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Created</span>
                                : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Failed</span>
                              }
                            </td>
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 shrink-0 flex items-center justify-between">
          {step === 0 && (
            <>
              <p className="text-xs text-gray-400">Upload a CSV file to begin</p>
              <button onClick={onClose} className="btn-secondary">Cancel</button>
            </>
          )}

          {step === 1 && (
            <>
              <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                {!requiredMapped && (
                  <p className="text-xs text-red-500">Map all required fields (*) to continue</p>
                )}
                <button
                  onClick={confirmMapping}
                  disabled={!requiredMapped}
                  className="btn-primary flex items-center gap-1.5 disabled:opacity-50"
                >
                  Preview {rawRows.length} Rows <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 2 && !results && (
            <>
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Edit Mapping
              </button>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">{validRows.length} of {mappedRows.length} rows ready</p>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {importing
                    ? <><Loader className="w-4 h-4 animate-spin" /> Importing…</>
                    : <><Upload className="w-4 h-4" /> Import {validRows.length} Students</>}
                </button>
              </div>
            </>
          )}

          {step === 2 && results && (
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
