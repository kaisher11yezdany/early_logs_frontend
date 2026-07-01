import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, DollarSign,
  Bell, GraduationCap, Library, BarChart2, Settings, LogOut,
  FileText, Calendar, CheckSquare, UserCheck, Book
} from 'lucide-react';

const ROLE_MENUS = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'User Management', icon: Users, path: '/admin/users' },
    { label: 'Classes', icon: BookOpen, path: '/admin/classes' },
    { label: 'Students', icon: GraduationCap, path: '/admin/students' },
    { label: 'Fee Management', icon: DollarSign, path: '/admin/fees' },
    { label: 'Time Table', icon: Calendar, path: '/admin/timetable' },
    { label: 'Exams', icon: ClipboardList, path: '/admin/exams' },
    { label: 'Notices', icon: Bell, path: '/admin/notices' },
    { label: 'Reports', icon: BarChart2, path: '/admin/reports' },
  ],
  teacher: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
    { label: 'My Students', icon: GraduationCap, path: '/teacher/students' },
    { label: 'Attendance', icon: UserCheck, path: '/teacher/attendance' },
    { label: 'Assignments', icon: ClipboardList, path: '/teacher/assignments' },
    { label: 'Exams & Marks', icon: FileText, path: '/teacher/exams' },
    { label: 'Timetable', icon: Calendar, path: '/teacher/timetable' },
    { label: 'Notices', icon: Bell, path: '/teacher/notices' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
    { label: 'My Attendance', icon: CheckSquare, path: '/student/attendance' },
    { label: 'Assignments', icon: ClipboardList, path: '/student/assignments' },
    { label: 'Exams & Results', icon: FileText, path: '/student/exams' },
    { label: 'Timetable', icon: Calendar, path: '/student/timetable' },
    { label: 'Fee Details', icon: DollarSign, path: '/student/fees' },
    { label: 'Notices', icon: Bell, path: '/student/notices' },
  ],
  parent: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/parent' },
    { label: "Child's Progress", icon: BarChart2, path: '/parent/progress' },
    { label: 'Attendance', icon: CheckSquare, path: '/parent/attendance' },
    { label: 'Assignments', icon: ClipboardList, path: '/parent/assignments' },
    { label: 'Fee Payment', icon: DollarSign, path: '/parent/fees' },
    { label: 'Notices', icon: Bell, path: '/parent/notices' },
  ],
  accountant: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/accountant' },
    { label: 'Fee Collection', icon: DollarSign, path: '/accountant/fees' },
    { label: 'Payments', icon: FileText, path: '/accountant/payments' },
    { label: 'Reports', icon: BarChart2, path: '/accountant/reports' },
  ],
  librarian: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/librarian' },
    { label: 'Book Inventory', icon: Book, path: '/librarian/books' },
    { label: 'Issue/Return', icon: Library, path: '/librarian/circulation' },
    { label: 'Reports', icon: BarChart2, path: '/librarian/reports' },
  ]
};

const ROLE_COLORS = {
  admin: 'from-blue-900 to-blue-700',
  teacher: 'from-emerald-900 to-emerald-700',
  student: 'from-purple-900 to-purple-700',
  parent: 'from-orange-900 to-orange-700',
  accountant: 'from-teal-900 to-teal-700',
  librarian: 'from-rose-900 to-rose-700'
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = ROLE_MENUS[user?.role] || [];
  const gradient = ROLE_COLORS[user?.role] || 'from-blue-900 to-blue-700';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-30 w-64 bg-gradient-to-b ${gradient}
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/20">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow">
            <GraduationCap className="text-blue-800 w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Early Logs</p>
            <p className="text-white/60 text-xs capitalize">{user?.role} Portal</p>
          </div>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-white/60 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menu.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length === 2}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
              }
              onClick={onClose}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="sidebar-link sidebar-link-inactive w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
