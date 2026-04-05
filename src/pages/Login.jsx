import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_DEMO = [
  { role: 'Admin', email: 'admin@earlylogs.com', password: 'Admin@123', color: 'bg-blue-100 text-blue-800' },
  { role: 'Teacher', email: 'priya.teacher@earlylogs.com', password: 'Teacher@123', color: 'bg-green-100 text-green-800' },
  { role: 'Student', email: 'aarav.student@earlylogs.com', password: 'Student@123', color: 'bg-purple-100 text-purple-800' },
  { role: 'Parent', email: 'parent@earlylogs.com', password: 'Parent@123', color: 'bg-orange-100 text-orange-800' },
];

const ROLE_REDIRECTS = {
  admin: '/admin', teacher: '/teacher', student: '/student',
  parent: '/parent', accountant: '/accountant', librarian: '/librarian'
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(ROLE_REDIRECTS[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex rounded-2xl shadow-2xl overflow-hidden">

        {/* Left - Brand */}
        <div className="hidden md:flex flex-col justify-between w-2/5 bg-white/10 backdrop-blur-sm p-8 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Early Logs</h1>
                <p className="text-blue-200 text-xs">Institute Management System</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 leading-tight">Manage Your School<br />Effortlessly</h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              A centralized platform for academics, administration, finance, HR, communication & transportation.
            </p>
          </div>

          <div className="space-y-3">
            {['Role-based Access Control', 'Real-time Analytics', 'Digital Classrooms', 'Fee & Finance Management'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-blue-100">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                {f}
              </div>
            ))}
          </div>

          {/* Demo creds */}
          <div>
            <p className="text-xs text-blue-300 mb-2 font-semibold uppercase tracking-wide">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_DEMO.map(d => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d)}
                  className="text-left p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${d.color}`}>{d.role}</span>
                  <p className="text-xs text-blue-200 mt-1 truncate">{d.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="flex-1 bg-white p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Early Logs IMS</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-7">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    className="input-field pl-9"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-9 pr-10"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Mobile demo creds */}
            <div className="md:hidden mt-6">
              <p className="text-xs text-gray-500 text-center mb-3">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_DEMO.map(d => (
                  <button
                    key={d.role}
                    onClick={() => fillDemo(d)}
                    className="text-left p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${d.color}`}>{d.role}</span>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{d.password}</p>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              © 2024 Early Logs Institute Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
