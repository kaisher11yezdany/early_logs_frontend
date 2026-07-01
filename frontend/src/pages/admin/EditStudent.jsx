import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle,
  ClipboardList, User, MapPin, Users, BookOpen, FileText, Check,
  Upload, FileCheck, X, Camera
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ── Section metadata ──────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 0, label: 'Admission Details',   icon: ClipboardList },
  { id: 1, label: 'Student Info',        icon: User },
  { id: 2, label: 'Contact & Address',   icon: MapPin },
  { id: 3, label: "Father's Details",    icon: Users },
  { id: 4, label: "Mother's Details",    icon: Users },
  { id: 5, label: 'Previous School',     icon: BookOpen },
  { id: 6, label: 'Documents',           icon: FileText },
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const CATEGORIES = ['General','OBC','SC','ST','Other'];
const QUALIFICATIONS = ['Below 10th','10th','12th','Diploma','Graduate','Post Graduate','PhD','Other'];

const EMPTY = {
  admissionNo: '', academicYear: '2025-2026', classId: '',
  admissionDate: '', admissionTime: '', admissionDay: '', rollNo: '',
  name: '', dateOfBirth: '', gender: '', caste: '', category: '',
  nationality: 'Indian', religion: '', placeOfBirth: '', aadharNo: '',
  language: '', bloodGroup: '',
  email: '', phone: '', password: '',
  currentStreet: '', currentCity: '', currentState: '', currentPincode: '',
  permanentStreet: '', permanentCity: '', permanentState: '', permanentPincode: '',
  sameAddress: false,
  fatherName: '', fatherQualification: '', fatherOccupation: '',
  fatherAadhar: '', fatherEmail: '', fatherPhone: '',
  motherName: '', motherQualification: '', motherOccupation: '',
  motherAadhar: '', motherEmail: '', motherPhone: '',
  prevSchoolName: '', prevStandard: '', prevTransferNoDate: '',
  prevProgress: '', prevDateOfLeaving: '', prevTcNoDate: '',
  prevPenNo: '', prevSatsNo: '', prevApparId: '', prevUdiseCode: '',
  docAadhar: false, docTc: false, docBirth: false,
  docBpl: false, docCaste: false, docConduct: false,
  guardianName: '', guardianRelation: '', guardianAadharNo: '', guardianPhone: '',
};

// ── Map API student → flat form ───────────────────────────────────────────────
function studentToForm(s) {
  const isoDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
  return {
    admissionNo:   s.admissionNo  || '',
    academicYear:  s.academicYear || '2025-2026',
    classId:       s.class?._id  || '',
    admissionDate: isoDate(s.admissionDate),
    admissionTime: s.admissionTime || '',
    admissionDay:  s.admissionDay  || '',
    rollNo:        s.rollNo        || '',
    name:          s.user?.name    || '',
    dateOfBirth:   isoDate(s.dateOfBirth),
    gender:        s.gender        || '',
    caste:         s.caste         || '',
    category:      s.category      || '',
    nationality:   s.nationality   || 'Indian',
    religion:      s.religion      || '',
    placeOfBirth:  s.placeOfBirth  || '',
    aadharNo:      s.aadharNo      || '',
    language:      s.language      || '',
    bloodGroup:    s.bloodGroup    || '',
    email:         s.user?.email   || '',
    phone:         s.user?.phone   || '',
    password: '',
    currentStreet:   s.address?.street   || '',
    currentCity:     s.address?.city     || '',
    currentState:    s.address?.state    || '',
    currentPincode:  s.address?.pincode  || '',
    permanentStreet:  s.permanentAddress?.street  || '',
    permanentCity:    s.permanentAddress?.city    || '',
    permanentState:   s.permanentAddress?.state   || '',
    permanentPincode: s.permanentAddress?.pincode || '',
    sameAddress: false,
    fatherName:          s.parentInfo?.father?.name          || '',
    fatherQualification: s.parentInfo?.father?.qualification || '',
    fatherOccupation:    s.parentInfo?.father?.occupation    || '',
    fatherAadhar:        s.parentInfo?.father?.aadharNo      || '',
    fatherEmail:         s.parentInfo?.father?.email         || '',
    fatherPhone:         s.parentInfo?.father?.phone         || '',
    motherName:          s.parentInfo?.mother?.name          || '',
    motherQualification: s.parentInfo?.mother?.qualification || '',
    motherOccupation:    s.parentInfo?.mother?.occupation    || '',
    motherAadhar:        s.parentInfo?.mother?.aadharNo      || '',
    motherEmail:         s.parentInfo?.mother?.email         || '',
    motherPhone:         s.parentInfo?.mother?.phone         || '',
    prevSchoolName:      s.previousSchool?.name                  || '',
    prevStandard:        s.previousSchool?.standardLastStudied   || '',
    prevTransferNoDate:  s.previousSchool?.transferNoDate        || '',
    prevProgress:        s.previousSchool?.previousProgress      || '',
    prevDateOfLeaving:   isoDate(s.previousSchool?.dateOfLeaving),
    prevTcNoDate:        s.previousSchool?.tcNoDate              || '',
    prevPenNo:           s.previousSchool?.penNo                 || '',
    prevSatsNo:          s.previousSchool?.satsNo                || '',
    prevApparId:         s.previousSchool?.apparId               || '',
    prevUdiseCode:       s.previousSchool?.udiseCode             || '',
    docAadhar:  s.documents?.aadharCard           || false,
    docTc:      s.documents?.tc                   || false,
    docBirth:   s.documents?.birthCertificate     || false,
    docBpl:     s.documents?.bplCard              || false,
    docCaste:   s.documents?.casteIncomeCert      || false,
    docConduct: s.documents?.conductCharacterCert || false,
    guardianName:     s.parentInfo?.guardian?.name     || '',
    guardianRelation: s.parentInfo?.guardian?.relation || '',
    guardianAadharNo: s.parentInfo?.guardian?.aadharNo || '',
    guardianPhone:    s.parentInfo?.guardian?.phone    || '',
  };
}

// ── Photo Upload Field ─────────────────────────────────────────────────────────
function PhotoUploadField({ photoFile, existingPhotoUrl, onPhotoChange }) {
  const previewUrl = photoFile ? URL.createObjectURL(photoFile) : existingPhotoUrl || null;
  return (
    <div className="sm:col-span-2 flex flex-col items-center gap-2 py-2">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 bg-gray-100 flex items-center justify-center">
          {previewUrl
            ? <img src={previewUrl} className="w-full h-full object-cover" alt="Student photo" />
            : <User className="w-10 h-10 text-gray-300" />
          }
        </div>
        <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-md">
          <Camera className="w-4 h-4 text-white" />
          <input type="file" className="sr-only" accept="image/jpeg,image/jpg,image/png"
            onChange={e => onPhotoChange(e.target.files[0] || null)} />
        </label>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">Student Photo</p>
        <p className="text-xs text-gray-400">JPG, PNG · max 5 MB · used on ID card</p>
      </div>
      {photoFile && (
        <button type="button" onClick={() => onPhotoChange(null)}
          className="text-xs text-red-500 hover:text-red-600 transition">
          Remove photo
        </button>
      )}
    </div>
  );
}

// ── File Upload Field ──────────────────────────────────────────────────────────
function FileUploadField({ label, fieldName, file, existing, onFileChange }) {
  return (
    <div>
      <label className="label">
        {label}
        <span className="text-gray-400 text-xs font-normal ml-1">(Optional · PDF / JPG / PNG · max 5 MB)</span>
      </label>
      {existing && !file && (
        <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
          <FileCheck className="w-3 h-3" /> Already uploaded: {existing}
        </p>
      )}
      <div className={`border-2 border-dashed rounded-xl p-3 transition ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
        {!file ? (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{existing ? 'Replace file' : 'Click to upload'}</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5 MB</p>
            </div>
            <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => onFileChange(fieldName, e.target.files[0] || null)} />
          </label>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-700 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button type="button" onClick={() => onFileChange(fieldName, null)}
              className="p-1 text-gray-400 hover:text-red-500 transition rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}
function Input({ name, form, onChange, type = 'text', placeholder = '' }) {
  return (
    <input type={type} className="input-field" name={name}
      value={form[name]} onChange={onChange} placeholder={placeholder} />
  );
}
function Select({ name, form, onChange, options, placeholder = 'Select...' }) {
  return (
    <select className="input-field" name={name} value={form[name]} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map(o =>
        typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(new Set());
  const [files, setFiles] = useState({
    photo: null,
    studentAadhar: null, fatherAadhar: null, motherAadhar: null,
    guardianAadhar: null, transferCertificate: null
  });
  const [existingUploads, setExistingUploads] = useState({});
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  const onFileChange = (field, file) => setFiles(f => ({ ...f, [field]: file }));

  useEffect(() => {
    Promise.all([
      api.get(`/students/${id}`),
      api.get('/classes'),
    ]).then(([stuRes, clsRes]) => {
      const stu = stuRes.data.student;
      setForm(studentToForm(stu));
      setClasses(clsRes.data.classes || []);
      if (stu.photo) {
        const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
        setExistingPhotoUrl(stu.photo.startsWith('http') ? stu.photo : `${apiBase}${stu.photo}`);
      }
      if (stu.documentUploads) {
        const ex = {};
        Object.entries(stu.documentUploads).forEach(([k, v]) => { if (v?.originalName) ex[k] = v.originalName; });
        setExistingUploads(ex);
      }
    }).catch(err => {
      toast.error(err.response?.data?.message || 'Failed to load student');
      navigate('/admin/students');
    }).finally(() => setLoading(false));
  }, [id]);

  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => {
      const next = { ...f, [name]: type === 'checkbox' ? checked : value };
      if (name === 'sameAddress' && checked) {
        next.permanentStreet  = f.currentStreet;
        next.permanentCity    = f.currentCity;
        next.permanentState   = f.currentState;
        next.permanentPincode = f.currentPincode;
      }
      if (name.startsWith('current') && f.sameAddress) {
        const pKey = 'permanent' + name.slice('current'.length);
        next[pKey] = value;
      }
      return next;
    });
  };

  const validateStep = (s) => {
    if (s === 0) {
      if (!form.admissionNo) { toast.error('Admission number is required'); return false; }
      if (!form.classId)     { toast.error('Please select a class'); return false; }
    }
    if (s === 1 && !form.name) { toast.error('Student name is required'); return false; }
    if (s === 2 && !form.email) { toast.error('Email is required'); return false; }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setCompleted(c => new Set([...c, step]));
    setStep(s => Math.min(s + 1, SECTIONS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setSaving(true);
    try {
      const payload = {
        // User fields
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        ...(form.password ? { password: form.password } : {}),
        // Student core
        classId:       form.classId,
        admissionNo:   form.admissionNo,
        rollNo:        form.rollNo,
        academicYear:  form.academicYear,
        admissionDate: form.admissionDate || undefined,
        admissionTime: form.admissionTime,
        admissionDay:  form.admissionDay,
        // Identity
        dateOfBirth:  form.dateOfBirth || undefined,
        gender:       form.gender,
        caste:        form.caste,
        category:     form.category,
        nationality:  form.nationality,
        religion:     form.religion,
        placeOfBirth: form.placeOfBirth,
        aadharNo:     form.aadharNo,
        language:     form.language,
        bloodGroup:   form.bloodGroup,
        // Addresses
        address: {
          street: form.currentStreet, city: form.currentCity,
          state:  form.currentState,  pincode: form.currentPincode,
        },
        permanentAddress: {
          street: form.permanentStreet, city: form.permanentCity,
          state:  form.permanentState,  pincode: form.permanentPincode,
        },
        // Parents
        parentInfo: {
          father: {
            name:          form.fatherName,
            qualification: form.fatherQualification,
            occupation:    form.fatherOccupation,
            aadharNo:      form.fatherAadhar,
            email:         form.fatherEmail,
            phone:         form.fatherPhone,
          },
          mother: {
            name:          form.motherName,
            qualification: form.motherQualification,
            occupation:    form.motherOccupation,
            aadharNo:      form.motherAadhar,
            email:         form.motherEmail,
            phone:         form.motherPhone,
          },
          guardian: {
            name:     form.guardianName,
            relation: form.guardianRelation,
            aadharNo: form.guardianAadharNo,
            phone:    form.guardianPhone,
          },
        },
        // Previous school
        previousSchool: {
          name:                form.prevSchoolName,
          standardLastStudied: form.prevStandard,
          transferNoDate:      form.prevTransferNoDate,
          previousProgress:    form.prevProgress,
          dateOfLeaving:       form.prevDateOfLeaving || undefined,
          tcNoDate:            form.prevTcNoDate,
          penNo:               form.prevPenNo,
          satsNo:              form.prevSatsNo,
          apparId:             form.prevApparId,
          udiseCode:           form.prevUdiseCode,
        },
        // Documents
        documents: {
          aadharCard:           form.docAadhar,
          tc:                   form.docTc,
          birthCertificate:     form.docBirth,
          bplCard:              form.docBpl,
          casteIncomeCert:      form.docCaste,
          conductCharacterCert: form.docConduct,
        },
      };

      await api.put(`/students/${id}`, payload);

      // Upload any new files
      const hasFiles = Object.values(files).some(Boolean);
      if (hasFiles) {
        const fd = new FormData();
        Object.entries(files).forEach(([key, file]) => { if (file) fd.append(key, file); });
        await api.post(`/students/${id}/uploads`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Student updated successfully!');
      navigate(`/admin/students/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;

  return (
    <div className="max-w-5xl mx-auto fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/admin/students/${id}`)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-gray-800">Edit Student</h1>
          <p className="text-sm text-gray-400 mt-0.5">Update student enrollment details</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar stepper (desktop) */}
        <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0">
          {SECTIONS.map(s => {
            const done = completed.has(s.id);
            const active = step === s.id;
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition
                  ${active   ? 'bg-blue-700 text-white'
                  : done     ? 'bg-green-50 text-green-700'
                             : 'text-gray-500 hover:bg-gray-100'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                  ${active ? 'bg-white/20' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : s.id + 1}
                </div>
                {s.label}
              </button>
            );
          })}
        </aside>

        {/* Mobile stepper */}
        <div className="lg:hidden w-full mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-1 min-w-max">
            {SECTIONS.map(s => {
              const done = completed.has(s.id);
              const active = step === s.id;
              return (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition
                    ${active ? 'bg-blue-700 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {done ? <Check className="w-3 h-3" /> : <span>{s.id + 1}</span>}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="flex-1 min-w-0">
          <div className="card">
            {/* Section title */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              {(() => { const S = SECTIONS[step]; return <S.icon className="w-5 h-5 text-blue-700" />; })()}
              <div>
                <h2 className="text-gray-800 text-base">{SECTIONS[step].label}</h2>
                <p className="text-xs text-gray-400">Step {step + 1} of {SECTIONS.length}</p>
              </div>
            </div>

            {/* ── Section 0: Admission Details ── */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Admission No" required>
                  <Input name="admissionNo" form={form} onChange={onChange} placeholder="e.g. 2026/001" />
                </Field>
                <Field label="Academic Year" required>
                  <Input name="academicYear" form={form} onChange={onChange} placeholder="2025-2026" />
                </Field>
                <Field label="Class" required>
                  <select className="input-field" name="classId" value={form.classId} onChange={onChange}>
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
                  </select>
                </Field>
                <Field label="Roll No">
                  <Input name="rollNo" form={form} onChange={onChange} placeholder="e.g. 01" />
                </Field>
                <Field label="Admission Date">
                  <Input name="admissionDate" form={form} onChange={onChange} type="date" />
                </Field>
                <Field label="Day">
                  <Select name="admissionDay" form={form} onChange={onChange} options={DAYS} placeholder="Select day..." />
                </Field>
                <Field label="Admission Time">
                  <Input name="admissionTime" form={form} onChange={onChange} type="time" />
                </Field>
              </div>
            )}

            {/* ── Section 1: Student Information ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PhotoUploadField
                  photoFile={files.photo}
                  existingPhotoUrl={existingPhotoUrl}
                  onPhotoChange={f => onFileChange('photo', f)}
                />
                <div className="sm:col-span-2">
                  <Field label="Name of Student (as per Birth Certificate)" required>
                    <Input name="name" form={form} onChange={onChange} placeholder="Full name" />
                  </Field>
                </div>
                <Field label="Date of Birth">
                  <Input name="dateOfBirth" form={form} onChange={onChange} type="date" />
                </Field>
                <Field label="Gender">
                  <Select name="gender" form={form} onChange={onChange}
                    options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]}
                    placeholder="Select gender..." />
                </Field>
                <Field label="Caste">
                  <Input name="caste" form={form} onChange={onChange} placeholder="e.g. Brahmin" />
                </Field>
                <Field label="Category">
                  <Select name="category" form={form} onChange={onChange} options={CATEGORIES} placeholder="Select category..." />
                </Field>
                <Field label="Nationality">
                  <Input name="nationality" form={form} onChange={onChange} placeholder="Indian" />
                </Field>
                <Field label="Religion">
                  <Input name="religion" form={form} onChange={onChange} placeholder="e.g. Hindu" />
                </Field>
                <Field label="Place of Birth">
                  <Input name="placeOfBirth" form={form} onChange={onChange} placeholder="City / Town" />
                </Field>
                <Field label="Language">
                  <Input name="language" form={form} onChange={onChange} placeholder="e.g. Kannada" />
                </Field>
                <Field label="Student Aadhar Card No">
                  <Input name="aadharNo" form={form} onChange={onChange} placeholder="12-digit Aadhar number" />
                </Field>
                <Field label="Blood Group">
                  <Select name="bloodGroup" form={form} onChange={onChange} options={BLOOD_GROUPS} placeholder="Select blood group..." />
                </Field>
                <div className="sm:col-span-2">
                  <FileUploadField label="Student Aadhar Card (Upload)"
                    fieldName="studentAadhar" file={files.studentAadhar}
                    existing={existingUploads.studentAadhar} onFileChange={onFileChange} />
                </div>
              </div>
            )}

            {/* ── Section 2: Contact & Address ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email Address (Login ID)" required>
                    <Input name="email" form={form} onChange={onChange} type="email" placeholder="student@example.com" />
                  </Field>
                  <Field label="Phone Number">
                    <Input name="phone" form={form} onChange={onChange} placeholder="10-digit mobile" />
                  </Field>
                  <Field label="New Password">
                    <Input name="password" form={form} onChange={onChange} type="password" placeholder="Leave blank to keep current password" />
                  </Field>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Current Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Street / House No">
                        <Input name="currentStreet" form={form} onChange={onChange} placeholder="Street address" />
                      </Field>
                    </div>
                    <Field label="City"><Input name="currentCity" form={form} onChange={onChange} placeholder="City" /></Field>
                    <Field label="State"><Input name="currentState" form={form} onChange={onChange} placeholder="State" /></Field>
                    <Field label="Pincode"><Input name="currentPincode" form={form} onChange={onChange} placeholder="Pincode" /></Field>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-600">Permanent Address</h3>
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                      <input type="checkbox" name="sameAddress" checked={form.sameAddress} onChange={onChange} className="rounded" />
                      Same as current address
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Street / House No">
                        <Input name="permanentStreet" form={form} onChange={onChange} placeholder="Street address" />
                      </Field>
                    </div>
                    <Field label="City"><Input name="permanentCity" form={form} onChange={onChange} placeholder="City" /></Field>
                    <Field label="State"><Input name="permanentState" form={form} onChange={onChange} placeholder="State" /></Field>
                    <Field label="Pincode"><Input name="permanentPincode" form={form} onChange={onChange} placeholder="Pincode" /></Field>
                  </div>
                </div>
              </div>
            )}

            {/* ── Section 3: Father's Details ── */}
            {step === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Father's Full Name">
                    <Input name="fatherName" form={form} onChange={onChange} placeholder="Father's full name" />
                  </Field>
                </div>
                <Field label="Qualification">
                  <Select name="fatherQualification" form={form} onChange={onChange} options={QUALIFICATIONS} placeholder="Select qualification..." />
                </Field>
                <Field label="Occupation">
                  <Input name="fatherOccupation" form={form} onChange={onChange} placeholder="e.g. Engineer" />
                </Field>
                <Field label="Aadhar Card No">
                  <Input name="fatherAadhar" form={form} onChange={onChange} placeholder="12-digit Aadhar number" />
                </Field>
                <Field label="Contact No">
                  <Input name="fatherPhone" form={form} onChange={onChange} placeholder="10-digit mobile" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="E-Mail ID">
                    <Input name="fatherEmail" form={form} onChange={onChange} type="email" placeholder="Father's email" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <FileUploadField label="Father's Aadhar Card (Upload)"
                    fieldName="fatherAadhar" file={files.fatherAadhar}
                    existing={existingUploads.fatherAadhar} onFileChange={onFileChange} />
                </div>
              </div>
            )}

            {/* ── Section 4: Mother's Details ── */}
            {step === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Mother's Full Name">
                    <Input name="motherName" form={form} onChange={onChange} placeholder="Mother's full name" />
                  </Field>
                </div>
                <Field label="Qualification">
                  <Select name="motherQualification" form={form} onChange={onChange} options={QUALIFICATIONS} placeholder="Select qualification..." />
                </Field>
                <Field label="Occupation">
                  <Input name="motherOccupation" form={form} onChange={onChange} placeholder="e.g. Homemaker" />
                </Field>
                <Field label="Aadhar Card No">
                  <Input name="motherAadhar" form={form} onChange={onChange} placeholder="12-digit Aadhar number" />
                </Field>
                <Field label="Contact No">
                  <Input name="motherPhone" form={form} onChange={onChange} placeholder="10-digit mobile" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="E-Mail ID">
                    <Input name="motherEmail" form={form} onChange={onChange} type="email" placeholder="Mother's email" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <FileUploadField label="Mother's Aadhar Card (Upload)"
                    fieldName="motherAadhar" file={files.motherAadhar}
                    existing={existingUploads.motherAadhar} onFileChange={onFileChange} />
                </div>
              </div>
            )}

            {/* ── Section 5: Previous School ── */}
            {step === 5 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Last School Attended">
                    <Input name="prevSchoolName" form={form} onChange={onChange} placeholder="Full name of previous school" />
                  </Field>
                </div>
                <Field label="Standard Last Studied">
                  <Input name="prevStandard" form={form} onChange={onChange} placeholder="e.g. Class 5" />
                </Field>
                <Field label="No. and Date of Transfer Certificate">
                  <Input name="prevTransferNoDate" form={form} onChange={onChange} placeholder="TC No. / DD-MM-YYYY" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Previous Progress of the Student">
                    <Input name="prevProgress" form={form} onChange={onChange} placeholder="e.g. Promoted, Excellent" />
                  </Field>
                </div>
                <Field label="Date of Leaving School">
                  <Input name="prevDateOfLeaving" form={form} onChange={onChange} type="date" />
                </Field>
                <Field label="No. and Date of T.C">
                  <Input name="prevTcNoDate" form={form} onChange={onChange} placeholder="TC No. / Date" />
                </Field>
                <Field label="PEN No">
                  <Input name="prevPenNo" form={form} onChange={onChange} placeholder="Permanent Education Number" />
                </Field>
                <Field label="SATS No">
                  <Input name="prevSatsNo" form={form} onChange={onChange} placeholder="SATS Number" />
                </Field>
                <Field label="Appar ID">
                  <Input name="prevApparId" form={form} onChange={onChange} placeholder="Appar ID" />
                </Field>
                <Field label="UDISE Code">
                  <Input name="prevUdiseCode" form={form} onChange={onChange} placeholder="UDISE Code" />
                </Field>
                <div className="sm:col-span-2">
                  <FileUploadField label="Transfer Certificate (Upload)"
                    fieldName="transferCertificate" file={files.transferCertificate}
                    existing={existingUploads.transferCertificate} onFileChange={onFileChange} />
                </div>
              </div>
            )}

            {/* ── Section 6: Documents Submitted ── */}
            {step === 6 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">Check all documents that have been submitted.</p>
                {[
                  { name: 'docAadhar',  label: 'Aadhar Card' },
                  { name: 'docTc',      label: 'Transfer Certificate (TC)' },
                  { name: 'docBirth',   label: 'Birth Certificate' },
                  { name: 'docBpl',     label: 'BPL Card' },
                  { name: 'docCaste',   label: 'Caste & Income Certificate' },
                  { name: 'docConduct', label: 'Certificate of Conduct & Character' },
                ].map(doc => (
                  <label key={doc.name}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition
                      ${form[doc.name] ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition
                      ${form[doc.name] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {form[doc.name] && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <input type="checkbox" name={doc.name} checked={form[doc.name]} onChange={onChange} className="sr-only" />
                    <span className={`text-sm font-medium ${form[doc.name] ? 'text-green-700' : 'text-gray-600'}`}>{doc.label}</span>
                    {form[doc.name] && <span className="ml-auto text-xs font-semibold text-green-600">Submitted</span>}
                  </label>
                ))}

                {/* Guardian Information */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-600 mb-3">Guardian Details <span className="text-gray-400 font-normal">(if different from parents)</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Guardian Name">
                      <Input name="guardianName" form={form} onChange={onChange} placeholder="Full name of guardian" />
                    </Field>
                    <Field label="Relation to Student">
                      <Input name="guardianRelation" form={form} onChange={onChange} placeholder="e.g. Uncle, Grandparent" />
                    </Field>
                    <Field label="Guardian Aadhar No">
                      <Input name="guardianAadharNo" form={form} onChange={onChange} placeholder="12-digit Aadhar number" />
                    </Field>
                    <Field label="Guardian Contact No">
                      <Input name="guardianPhone" form={form} onChange={onChange} placeholder="10-digit mobile number" />
                    </Field>
                    <div className="sm:col-span-2">
                      <FileUploadField label="Guardian's Aadhar Card (Upload)"
                        fieldName="guardianAadhar" file={files.guardianAadhar}
                        existing={existingUploads.guardianAadhar} onFileChange={onFileChange} />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Update Summary</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
                    <span>Student:</span><span className="font-medium">{form.name || '—'}</span>
                    <span>Admission No:</span><span className="font-medium">{form.admissionNo || '—'}</span>
                    <span>Class:</span>
                    <span className="font-medium">{classes.find(c => c._id === form.classId)?.name || '—'}</span>
                    <span>Documents:</span>
                    <span className="font-medium">
                      {[form.docAadhar,form.docTc,form.docBirth,form.docBpl,form.docCaste,form.docConduct].filter(Boolean).length} / 6 submitted
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-100">
              <button
                onClick={step === 0 ? () => navigate(`/admin/students/${id}`) : goBack}
                className="btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {step === 0 ? 'Cancel' : 'Back'}
              </button>

              {step < SECTIONS.length - 1 ? (
                <button onClick={goNext} className="btn-primary flex items-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={saving}
                  className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
