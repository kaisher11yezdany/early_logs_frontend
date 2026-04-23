import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth
import Login from './pages/Login';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ClassManagement from './pages/admin/ClassManagement';
import StudentManagement from './pages/admin/StudentManagement';
import AddStudent from './pages/admin/AddStudent';
import ViewStudent from './pages/admin/ViewStudent';
import EditStudent from './pages/admin/EditStudent';
import FeeManagement from './pages/admin/FeeManagement';
import NoticeManagement from './pages/admin/NoticeManagement';
import TimetableAdmin from './pages/admin/Timetable';
import TimetableView from './pages/shared/TimetableView';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AttendanceMarking from './pages/teacher/AttendanceMarking';
import TeacherAssignments from './pages/teacher/TeacherAssignments';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import MyAttendance from './pages/student/MyAttendance';
import MyAssignments from './pages/student/MyAssignments';
import MyExams from './pages/student/MyExams';

// Parent
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentFees from './pages/parent/ParentFees';

// Shared
import NoticesPage from './pages/shared/NoticesPage';

// ─── Protected Route ───────────────────────────────────────────────────────
function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const redirects = { admin: '/admin', teacher: '/teacher', student: '/student', parent: '/parent', accountant: '/accountant', librarian: '/librarian' };
  return <Navigate to={redirects[user?.role] || '/login'} replace />;
}

// ─── Simple placeholder for unbuilt pages ──────────────────────────────────
function ComingSoon({ title }) {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center fade-in">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-gray-700">{title}</h2>
      <p className="text-gray-400 text-sm mt-2">This module is under development in the next sprint.</p>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-red-500 mb-2">403</h1>
                <p className="text-gray-600">You are not authorized to access this page.</p>
                <a href="/login" className="mt-4 inline-block btn-primary">Back to Login</a>
              </div>
            </div>
          } />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/classes" element={<ClassManagement />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/students/add" element={<AddStudent />} />
            <Route path="/admin/students/:id/edit" element={<EditStudent />} />
            <Route path="/admin/students/:id" element={<ViewStudent />} />
            <Route path="/admin/fees" element={<FeeManagement />} />
            <Route path="/admin/notices" element={<NoticeManagement />} />
            <Route path="/admin/timetable" element={<TimetableAdmin />} />
            <Route path="/admin/exams" element={<ComingSoon title="Exam Management" />} />
            <Route path="/admin/reports" element={<ComingSoon title="Reports & Analytics" />} />
          </Route>

          {/* Teacher Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<ComingSoon title="My Students" />} />
            <Route path="/teacher/attendance" element={<AttendanceMarking />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/exams" element={<ComingSoon title="Exams & Marks" />} />
            <Route path="/teacher/timetable" element={<TimetableView />} />
            <Route path="/teacher/notices" element={<NoticesPage />} />
          </Route>

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<MyAttendance />} />
            <Route path="/student/assignments" element={<MyAssignments />} />
            <Route path="/student/exams" element={<MyExams />} />
            <Route path="/student/timetable" element={<TimetableView />} />
            <Route path="/student/fees" element={<ComingSoon title="Fee Details" />} />
            <Route path="/student/notices" element={<NoticesPage />} />
          </Route>

          {/* Parent Routes */}
          <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/progress" element={<ComingSoon title="Child's Progress" />} />
            <Route path="/parent/attendance" element={<ComingSoon title="Child's Attendance" />} />
            <Route path="/parent/assignments" element={<ComingSoon title="Child's Assignments" />} />
            <Route path="/parent/fees" element={<ParentFees />} />
            <Route path="/parent/notices" element={<NoticesPage />} />
          </Route>

          {/* Accountant Routes */}
          <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
            <Route path="/accountant" element={<ComingSoon title="Accountant Dashboard" />} />
            <Route path="/accountant/fees" element={<FeeManagement />} />
            <Route path="/accountant/payments" element={<ComingSoon title="Payment Records" />} />
            <Route path="/accountant/reports" element={<ComingSoon title="Financial Reports" />} />
          </Route>

          {/* Librarian Routes */}
          <Route element={<ProtectedRoute allowedRoles={['librarian']} />}>
            <Route path="/librarian" element={<ComingSoon title="Librarian Dashboard" />} />
            <Route path="/librarian/books" element={<ComingSoon title="Book Inventory" />} />
            <Route path="/librarian/circulation" element={<ComingSoon title="Issue/Return" />} />
            <Route path="/librarian/reports" element={<ComingSoon title="Library Reports" />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-200 mb-3">404</h1>
                <p className="text-gray-500">Page not found</p>
                <a href="/" className="mt-4 inline-block btn-primary">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LoginGuard() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    const redirects = { admin: '/admin', teacher: '/teacher', student: '/student', parent: '/parent', accountant: '/accountant', librarian: '/librarian' };
    return <Navigate to={redirects[user?.role] || '/'} replace />;
  }
  return <Login />;
}
