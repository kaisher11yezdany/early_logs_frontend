import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil, Mail, Phone, Briefcase, MapPin, User, BookOpen, AlertTriangle, CreditCard } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TeacherIDCardModal from '../../components/TeacherIDCardModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; }
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-700">{value || '—'}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ViewTeacher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIDCard, setShowIDCard] = useState(false);

  useEffect(() => {
    api.get(`/teachers/${id}`)
      .then(res => setTeacher(res.data.teacher))
      .catch(() => toast.error('Failed to load teacher'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!teacher) return (
    <div className="card text-center py-16 text-gray-400">Teacher not found.</div>
  );

  const t = teacher;

  // Teacher exists as a user account but has no full profile yet
  if (t.noProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 fade-in">
        {showIDCard && (
          <TeacherIDCardModal teacher={t} onClose={() => setShowIDCard(false)} />
        )}
        <PageHeader
          title="Teacher Profile"
          subtitle={t.user?.name}
          action={
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/admin/teachers')} className="btn-secondary flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setShowIDCard(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition">
                <CreditCard className="w-4 h-4" /> ID Card
              </button>
            </div>
          }
        />
        <div className="card flex flex-col items-center gap-5 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-3xl font-bold text-emerald-400">{t.user?.name?.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{t.user?.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{t.user?.email}</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            This teacher has a login account but no detailed profile yet.
          </div>
          <button
            onClick={() => navigate(`/admin/teachers/${id}/edit`)}
            className="btn-primary flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Complete Profile
          </button>
        </div>
      </div>
    );
  }
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  const photoUrl = t.photo ? (t.photo.startsWith('http') ? t.photo : `${base}${t.photo}`) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 fade-in">
      {showIDCard && (
        <TeacherIDCardModal teacher={t} onClose={() => setShowIDCard(false)} />
      )}
      <PageHeader
        title="Teacher Profile"
        subtitle={t.user?.name}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/teachers')} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setShowIDCard(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition">
              <CreditCard className="w-4 h-4" /> ID Card
            </button>
            <button onClick={() => navigate(`/admin/teachers/${id}/edit`)} className="btn-primary flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
        }
      />

      {/* Profile card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
            {photoUrl
              ? <img src={photoUrl} alt={t.user?.name} className="w-full h-full object-cover" />
              : <span className="text-4xl font-bold text-emerald-400">{t.user?.name?.charAt(0)}</span>
            }
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-800">{t.user?.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t.designation || 'Teacher'} {t.department ? `· ${t.department}` : ''}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
              {t.employeeId && (
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{t.employeeId}</span>
              )}
              {t.employmentType && (
                <span className="badge badge-green">{t.employmentType}</span>
              )}
              {!t.isActive && (
                <span className="badge badge-red flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Inactive</span>
              )}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-sm text-gray-500">
              {t.user?.email && (
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{t.user.email}</span>
              )}
              {t.user?.phone && (
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{t.user.phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Professional Info */}
        <Section icon={Briefcase} title="Professional Details">
          <InfoRow label="Employee ID"     value={t.employeeId} />
          <InfoRow label="Designation"     value={t.designation} />
          <InfoRow label="Department"      value={t.department} />
          <InfoRow label="Qualification"   value={t.qualification} />
          <InfoRow label="Experience"      value={t.experience != null ? `${t.experience} year${t.experience !== 1 ? 's' : ''}` : '—'} />
          <InfoRow label="Joining Date"    value={fmt(t.joiningDate)} />
          <InfoRow label="Employment Type" value={t.employmentType} />
        </Section>

        {/* Personal Info */}
        <Section icon={User} title="Personal Details">
          <InfoRow label="Date of Birth" value={fmt(t.dateOfBirth)} />
          <InfoRow label="Gender"        value={t.gender ? t.gender.charAt(0).toUpperCase() + t.gender.slice(1) : '—'} />
          <InfoRow label="Blood Group"   value={t.bloodGroup} />
          <InfoRow label="Nationality"   value={t.nationality} />
          <InfoRow label="Religion"      value={t.religion} />
          <InfoRow label="Aadhar No"     value={t.aadharNo} />
        </Section>

        {/* Current Address */}
        <Section icon={MapPin} title="Current Address">
          {t.address?.street || t.address?.city ? (
            <>
              <InfoRow label="Street"  value={t.address?.street} />
              <InfoRow label="City"    value={t.address?.city} />
              <InfoRow label="State"   value={t.address?.state} />
              <InfoRow label="Pincode" value={t.address?.pincode} />
            </>
          ) : <p className="text-sm text-gray-400">No address on record</p>}
        </Section>

        {/* Permanent Address */}
        <Section icon={MapPin} title="Permanent Address">
          {t.permanentAddress?.street || t.permanentAddress?.city ? (
            <>
              <InfoRow label="Street"  value={t.permanentAddress?.street} />
              <InfoRow label="City"    value={t.permanentAddress?.city} />
              <InfoRow label="State"   value={t.permanentAddress?.state} />
              <InfoRow label="Pincode" value={t.permanentAddress?.pincode} />
            </>
          ) : <p className="text-sm text-gray-400">Same as current</p>}
        </Section>

        {/* Emergency Contact */}
        {(t.emergencyContact?.name || t.emergencyContact?.phone) && (
          <Section icon={Phone} title="Emergency Contact">
            <InfoRow label="Name"     value={t.emergencyContact?.name} />
            <InfoRow label="Relation" value={t.emergencyContact?.relation} />
            <InfoRow label="Phone"    value={t.emergencyContact?.phone} />
          </Section>
        )}

        {/* Assigned Classes */}
        {t.user?.assignedClasses?.length > 0 && (
          <Section icon={BookOpen} title="Assigned Classes">
            <div className="flex flex-wrap gap-2">
              {t.user.assignedClasses.map((c, i) => (
                <span key={i} className="badge badge-blue">{c.name || c}</span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
