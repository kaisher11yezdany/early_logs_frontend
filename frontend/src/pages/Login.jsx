import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_REDIRECTS = {
  admin: '/admin', teacher: '/teacher', student: '/student',
  parent: '/parent', accountant: '/accountant', librarian: '/librarian'
};

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">

      {/* ── Background ── */}
      <img
        src="/login-bg.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark blue overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(5, 18, 80, 0.78)' }} />

      {/* ── Main content ── */}
      <div className="relative flex-1 flex items-center justify-between max-w-6xl w-full mx-auto px-6 sm:px-12 py-10 gap-8">

        {/* Left — School Branding */}
        <div className="hidden lg:flex flex-col gap-10 text-white max-w-[420px]">

          {/* Logo + school name */}
          <div className="flex flex-col gap-4">
            <img
              src="/login-logo.png"
              alt="Early Logs"
              style={{ width: 180, mixBlendMode: 'screen' }}
            />
          </div>

          {/* Tagline */}
          <div>
            <h2 className="text-[2.4rem] font-black leading-tight mb-4">
              Empowering Education.<br />Building Futures.
            </h2>
            <div className="w-12 h-[3px] bg-blue-400 rounded-full mb-5" />
            <p className="text-white/65 text-sm leading-relaxed">
              A comprehensive platform to manage academics, administration, finance,
              communication and more – all in one place.
            </p>
          </div>
        </div>

        {/* Right — Login Card */}
        <div className="w-full max-w-[460px] ml-auto">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 sm:px-10">

            <div className="mb-7">
              <h2 className="text-2xl font-black text-gray-900">Welcome Back!</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-11 py-3 text-sm text-gray-800 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition">
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                           bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                           disabled:opacity-60 text-white font-bold text-sm transition"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* OR divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-semibold tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Secure & Trusted */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-gray-100 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Secure &amp; Trusted</p>
                <p className="text-xs text-gray-400">Your data is safe with us</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="relative text-center pb-5">
        <p className="text-white/40 text-xs">
          © 2024 Early Foundation International School. All rights reserved.
        </p>
      </div>

    </div>
  );
}
