import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Camera, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STEPS = ['Personal Info', 'Professional Info', 'Address'];

// ── Photo upload field ─────────────────────────────────────────────────────────
function PhotoUploadField({ value, onChange }) {
  const inputRef = useRef();
  const preview = value ? URL.createObjectURL(value) : null;
  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="relative w-24 h-24">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center border-2 border-dashed border-emerald-300">
          {preview
            ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
            : <span className="text-3xl font-bold text-emerald-400">T</span>
          }
        </div>
        <button type="button" onClick={() => inputRef.current.click()}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow hover:bg-emerald-700 transition">
          <Camera className="w-3.5 h-3.5" />
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)}
            className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only"
        onChange={e => onChange(e.target.files[0] || null)} />
      <p className="text-xs text-gray-400">Upload profile photo</p>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="label-field">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part-time', 'Guest'];
const DEPARTMENTS = ['Mathematics', 'Science', 'Languages', 'Social Studies', 'Physical Education', 'Arts', 'Commerce', 'Computer Science', 'Other'];

export default function AddTeacher() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [photo, setPhoto]     = useState(null);

  const [form, setForm] = useState({
    // Personal
    name: '', email: '', phone: '', password: '',
    gender: '', dateOfBirth: '', bloodGroup: '', nationality: 'Indian', religion: '', aadharNo: '',
    // Professional
    employeeId: '', designation: '', department: '', qualification: '',
    experience: '', joiningDate: '', employmentType: '',
    // Address
    currentStreet: '', currentCity: '', currentState: '', currentPincode: '',
    permanentStreet: '', permanentCity: '', permanentState: '', permanentPincode: '',
    emergencyName: '', emergencyRelation: '', emergencyPhone: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const copyAddress = () => {
    setForm(f => ({
      ...f,
      permanentStreet: f.currentStreet,
      permanentCity:   f.currentCity,
      permanentState:  f.currentState,
      permanentPincode:f.currentPincode,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.employeeId) {
      toast.error('Name, Email, and Employee ID are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        password: form.password || form.employeeId,
        employeeId:     form.employeeId,
        designation:    form.designation,
        department:     form.department,
        qualification:  form.qualification,
        experience:     Number(form.experience) || 0,
        joiningDate:    form.joiningDate || undefined,
        employmentType: form.employmentType || undefined,
        dateOfBirth:    form.dateOfBirth || undefined,
        gender:         form.gender || undefined,
        bloodGroup:     form.bloodGroup || undefined,
        nationality:    form.nationality,
        religion:       form.religion,
        aadharNo:       form.aadharNo,
        address: { street: form.currentStreet, city: form.currentCity, state: form.currentState, pincode: form.currentPincode },
        permanentAddress: { street: form.permanentStreet, city: form.permanentCity, state: form.permanentState, pincode: form.permanentPincode },
        emergencyContact: { name: form.emergencyName, relation: form.emergencyRelation, phone: form.emergencyPhone },
      };

      const res = await api.post('/teachers', payload);
      const teacherId = res.data.teacher._id;

      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        await api.post(`/teachers/${teacherId}/uploads`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      toast.success('Teacher created successfully');
      navigate('/admin/teachers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 fade-in">
      <PageHeader
        title="Add Teacher"
        subtitle="Enroll a new teaching staff member"
        action={
          <button onClick={() => navigate('/admin/teachers')} className="btn-secondary flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* Step indicator */}
      <div className="card">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === step ? 'text-emerald-700' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-5">

        {/* ── Step 0: Personal Info ── */}
        {step === 0 && (
          <>
            <PhotoUploadField value={photo} onChange={setPhoto} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
              </Field>
              <Field label="Email Address" required>
                <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="priya@school.com" />
              </Field>
              <Field label="Phone Number">
                <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
              </Field>
              <Field label="Password">
                <input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Leave blank to use Employee ID" />
              </Field>
              <Field label="Date of Birth">
                <input className="input-field" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
              </Field>
              <Field label="Gender">
                <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Blood Group">
                <select className="input-field" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Nationality">
                <input className="input-field" value={form.nationality} onChange={e => set('nationality', e.target.value)} />
              </Field>
              <Field label="Religion">
                <input className="input-field" value={form.religion} onChange={e => set('religion', e.target.value)} />
              </Field>
              <Field label="Aadhar Number">
                <input className="input-field" value={form.aadharNo} onChange={e => set('aadharNo', e.target.value)} maxLength={12} placeholder="12-digit number" />
              </Field>
            </div>
          </>
        )}

        {/* ── Step 1: Professional Info ── */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employee ID" required>
              <input className="input-field" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="EMP001" />
            </Field>
            <Field label="Designation">
              <input className="input-field" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Senior Teacher" />
            </Field>
            <Field label="Department">
              <select className="input-field" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Qualification">
              <input className="input-field" value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="B.Ed, M.Sc" />
            </Field>
            <Field label="Experience (years)">
              <input className="input-field" type="number" min="0" value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="5" />
            </Field>
            <Field label="Joining Date">
              <input className="input-field" type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
            </Field>
            <Field label="Employment Type">
              <select className="input-field" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                <option value="">Select type</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
        )}

        {/* ── Step 2: Address ── */}
        {step === 2 && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street">
                  <input className="input-field" value={form.currentStreet} onChange={e => set('currentStreet', e.target.value)} />
                </Field>
                <Field label="City">
                  <input className="input-field" value={form.currentCity} onChange={e => set('currentCity', e.target.value)} />
                </Field>
                <Field label="State">
                  <input className="input-field" value={form.currentState} onChange={e => set('currentState', e.target.value)} />
                </Field>
                <Field label="Pincode">
                  <input className="input-field" value={form.currentPincode} onChange={e => set('currentPincode', e.target.value)} maxLength={6} />
                </Field>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Permanent Address</h3>
                <button type="button" onClick={copyAddress} className="text-xs text-emerald-600 hover:underline font-medium">
                  Same as current
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street">
                  <input className="input-field" value={form.permanentStreet} onChange={e => set('permanentStreet', e.target.value)} />
                </Field>
                <Field label="City">
                  <input className="input-field" value={form.permanentCity} onChange={e => set('permanentCity', e.target.value)} />
                </Field>
                <Field label="State">
                  <input className="input-field" value={form.permanentState} onChange={e => set('permanentState', e.target.value)} />
                </Field>
                <Field label="Pincode">
                  <input className="input-field" value={form.permanentPincode} onChange={e => set('permanentPincode', e.target.value)} maxLength={6} />
                </Field>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Name">
                  <input className="input-field" value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} />
                </Field>
                <Field label="Relation">
                  <input className="input-field" value={form.emergencyRelation} onChange={e => set('emergencyRelation', e.target.value)} placeholder="Spouse, Parent…" />
                </Field>
                <Field label="Phone">
                  <input className="input-field" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
                </Field>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/admin/teachers')}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn-primary flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? 'Saving…' : <><Check className="w-4 h-4" /> Save Teacher</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
