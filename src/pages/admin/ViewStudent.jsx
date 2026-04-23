import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, GraduationCap, User, MapPin, Users, BookOpen,
  FileText, CheckCircle2, XCircle, Phone,
  Hash, Pencil, Trash2, AlertTriangle, Download, FileCheck
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '—';
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

function Field({ label, value, mono }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`font-medium text-gray-700 text-sm break-words ${mono ? 'font-mono' : ''}`}>{val(value)}</p>
    </div>
  );
}

function SectionCard({ icon: Icon, title, color = 'blue', children }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    pink:   'bg-pink-50 text-pink-600',
    teal:   'bg-teal-50 text-teal-600',
    gray:   'bg-gray-100 text-gray-600',
  };
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DocItem({ label, checked }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      {checked
        ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        : <XCircle className="w-5 h-5 text-gray-300 shrink-0" />}
      <span className={`text-sm font-medium ${checked ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

function ConfirmDelete({ name, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Delete Student</h3>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-800">{name}</span>?
          Their student profile will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={deleting}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ViewStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/students/${id}`);
        setStudent(res.data.student);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load student');
        navigate('/admin/students');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted successfully');
      navigate('/admin/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!student) return null;

  const s = student;
  const name = s.user?.name || '—';
  const initial = name !== '—' ? name.charAt(0).toUpperCase() : '?';
  const cls = s.class ? `${s.class.name} – ${s.class.section || ''}` : '—';

  return (
    <>
      {showConfirm && (
        <ConfirmDelete
          name={name}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          deleting={deleting}
        />
      )}

      <div className="space-y-5 fade-in max-w-5xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate('/admin/students')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/students/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition border border-red-200"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Hero Strip */}
        <div className="card bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold shrink-0">
              {initial}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{name}</h1>
              <p className="text-purple-200 text-sm mt-0.5">{s.user?.email || '—'}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">{cls}</span>
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Adm: {val(s.admissionNo)}
                </span>
                {s.rollNo && (
                  <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Roll: {s.rollNo}
                  </span>
                )}
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${s.isActive ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Admission Details */}
        <SectionCard icon={GraduationCap} title="Admission Details" color="blue">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <Field label="Admission No" value={s.admissionNo} mono />
            <Field label="Roll No" value={s.rollNo} />
            <Field label="Academic Year" value={s.academicYear} />
            <Field label="Admission Date" value={fmtDate(s.admissionDate)} />
            <Field label="Admission Time" value={s.admissionTime} />
            <Field label="Admission Day" value={s.admissionDay} />
            <Field label="Class" value={s.class?.name} />
            <Field label="Section" value={s.section} />
          </div>
        </SectionCard>

        {/* 2. Student Information */}
        <SectionCard icon={User} title="Student Information" color="purple">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <Field label="Full Name" value={name} />
            <Field label="Date of Birth" value={fmtDate(s.dateOfBirth)} />
            <Field label="Gender" value={s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : undefined} />
            <Field label="Blood Group" value={s.bloodGroup} />
            <Field label="Aadhar No" value={s.aadharNo} mono />
            <Field label="Caste" value={s.caste} />
            <Field label="Category" value={s.category} />
            <Field label="Religion" value={s.religion} />
            <Field label="Nationality" value={s.nationality} />
            <Field label="Language" value={s.language} />
            <Field label="Place of Birth" value={s.placeOfBirth} />
          </div>
        </SectionCard>

        {/* 3. Contact & Address */}
        <SectionCard icon={MapPin} title="Contact & Address" color="green">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" value={s.user?.phone} />
              <Field label="Email" value={s.user?.email} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Address</p>
              <div className="grid grid-cols-1 gap-2">
                <Field label="Street" value={s.address?.street} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="City" value={s.address?.city} />
                  <Field label="State" value={s.address?.state} />
                </div>
                <Field label="Pincode" value={s.address?.pincode} mono />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Permanent Address</p>
              <div className="grid grid-cols-1 gap-2">
                <Field label="Street" value={s.permanentAddress?.street} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="City" value={s.permanentAddress?.city} />
                  <Field label="State" value={s.permanentAddress?.state} />
                </div>
                <Field label="Pincode" value={s.permanentAddress?.pincode} mono />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 4 & 5. Parent Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard icon={Users} title="Father's Details" color="orange">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={s.parentInfo?.father?.name} />
              <Field label="Phone" value={s.parentInfo?.father?.phone} />
              <Field label="Occupation" value={s.parentInfo?.father?.occupation} />
              <Field label="Qualification" value={s.parentInfo?.father?.qualification} />
              <Field label="Aadhar No" value={s.parentInfo?.father?.aadharNo} mono />
              <Field label="Email" value={s.parentInfo?.father?.email} />
            </div>
          </SectionCard>

          <SectionCard icon={Users} title="Mother's Details" color="pink">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={s.parentInfo?.mother?.name} />
              <Field label="Phone" value={s.parentInfo?.mother?.phone} />
              <Field label="Occupation" value={s.parentInfo?.mother?.occupation} />
              <Field label="Qualification" value={s.parentInfo?.mother?.qualification} />
              <Field label="Aadhar No" value={s.parentInfo?.mother?.aadharNo} mono />
              <Field label="Email" value={s.parentInfo?.mother?.email} />
            </div>
          </SectionCard>
        </div>

        {/* Guardian Details (only if filled) */}
        {(s.parentInfo?.guardian?.name || s.parentInfo?.guardian?.phone) && (
          <SectionCard icon={Users} title="Guardian Details" color="purple">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Name" value={s.parentInfo?.guardian?.name} />
              <Field label="Relation" value={s.parentInfo?.guardian?.relation} />
              <Field label="Aadhar No" value={s.parentInfo?.guardian?.aadharNo} mono />
              <Field label="Phone" value={s.parentInfo?.guardian?.phone} />
            </div>
          </SectionCard>
        )}

        {/* 6. Previous School */}
        <SectionCard icon={BookOpen} title="Previous School Records" color="teal">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <Field label="School Name" value={s.previousSchool?.name} />
            </div>
            <Field label="Standard Last Studied" value={s.previousSchool?.standardLastStudied} />
            <Field label="Previous Progress" value={s.previousSchool?.previousProgress} />
            <Field label="Transfer No / Date" value={s.previousSchool?.transferNoDate} />
            <Field label="Date of Leaving" value={fmtDate(s.previousSchool?.dateOfLeaving)} />
            <Field label="TC No / Date" value={s.previousSchool?.tcNoDate} />
            <Field label="PEN No" value={s.previousSchool?.penNo} mono />
            <Field label="SATS No" value={s.previousSchool?.satsNo} mono />
            <Field label="Appar ID" value={s.previousSchool?.apparId} mono />
            <Field label="UDISE Code" value={s.previousSchool?.udiseCode} mono />
          </div>
        </SectionCard>

        {/* 7. Documents Submitted */}
        <SectionCard icon={FileText} title="Documents Submitted" color="gray">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <DocItem label="Aadhar Card" checked={!!s.documents?.aadharCard} />
            <DocItem label="Transfer Certificate (TC)" checked={!!s.documents?.tc} />
            <DocItem label="Birth Certificate" checked={!!s.documents?.birthCertificate} />
            <DocItem label="BPL Card" checked={!!s.documents?.bplCard} />
            <DocItem label="Caste & Income Certificate" checked={!!s.documents?.casteIncomeCert} />
            <DocItem label="Certificate of Conduct & Character" checked={!!s.documents?.conductCharacterCert} />
          </div>
          {s.officeUse?.documentSubmitted && (
            <div className="mt-3">
              <Field label="Documents Note (Office)" value={s.officeUse.documentSubmitted} />
            </div>
          )}
        </SectionCard>

        {/* Uploaded Documents */}
        {s.documentUploads && Object.values(s.documentUploads).some(d => d?.filename) && (
          <SectionCard icon={FileCheck} title="Uploaded Documents" color="teal">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'studentAadhar',       label: "Student's Aadhar Card" },
                { key: 'fatherAadhar',        label: "Father's Aadhar Card" },
                { key: 'motherAadhar',        label: "Mother's Aadhar Card" },
                { key: 'guardianAadhar',      label: "Guardian's Aadhar Card" },
                { key: 'transferCertificate', label: 'Transfer Certificate' },
              ].filter(item => s.documentUploads[item.key]?.filename).map(item => {
                const doc = s.documentUploads[item.key];
                // In dev the Vite proxy forwards /uploads → localhost:5000/uploads.
                // In prod VITE_API_URL is the full Railway base so we strip /api.
                const base = import.meta.env.VITE_API_URL
                  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
                  : '';
                const url = `${base}/uploads/${doc.filename}`;
                return (
                  <a key={item.key} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 transition group">
                    <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-teal-800">{item.label}</p>
                      <p className="text-xs text-teal-500 truncate">{doc.originalName}</p>
                    </div>
                    <Download className="w-4 h-4 text-teal-500 group-hover:text-teal-700 shrink-0" />
                  </a>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Transport (conditional) */}
        {s.transport?.enrolled && (
          <SectionCard icon={Hash} title="Transport" color="blue">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Route" value={s.transport?.route} />
              <Field label="Bus No" value={s.transport?.busNo} />
            </div>
          </SectionCard>
        )}

        {/* Office Use Only (conditional) */}
        {(s.officeUse?.signOfEnrolled || s.officeUse?.dateOfEnrolment) && (
          <SectionCard icon={FileText} title="Office Use Only" color="gray">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Sign of Enrolled" value={s.officeUse?.signOfEnrolled} />
              <Field label="Date of Enrolment" value={fmtDate(s.officeUse?.dateOfEnrolment)} />
              <Field label="Time of Enrolment" value={s.officeUse?.timeOfEnrolment} />
              <Field label="Day of Enrolment" value={s.officeUse?.dayOfEnrolment} />
            </div>
          </SectionCard>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pb-8 flex-wrap gap-3">
          <button onClick={() => navigate('/admin/students')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/students/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              <Pencil className="w-4 h-4" /> Edit Student
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition border border-red-200"
            >
              <Trash2 className="w-4 h-4" /> Delete Student
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
