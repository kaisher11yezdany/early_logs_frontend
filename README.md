# Early Logs Institute Management System (IMS)

A full-stack School ERP built with **React.js** + **Node.js** + **MongoDB**.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### 1. Setup & Run Backend
```bash
cd backend
npm install
# Edit .env if needed (MongoDB URI, JWT secret)
npm run seed      # Seed demo data
npm run dev       # Start backend on http://localhost:5000
```

### 2. Setup & Run Frontend
```bash
cd frontend
npm install
npm run dev       # Start frontend on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

| Role      | Email                          | Password     |
|-----------|-------------------------------|--------------|
| Admin     | admin@earlylogs.com           | Admin@123    |
| Teacher   | priya.teacher@earlylogs.com   | Teacher@123  |
| Teacher   | rahul.teacher@earlylogs.com   | Teacher@123  |
| Student   | aarav.student@earlylogs.com   | Student@123  |
| Student   | sneha.student@earlylogs.com   | Student@123  |
| Parent    | parent@earlylogs.com          | Parent@123   |

---

## 📦 Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 + Vite + Tailwind CSS |
| Routing   | React Router v6 |
| Charts    | Recharts |
| Backend   | Node.js + Express.js |
| Database  | MongoDB + Mongoose |
| Auth      | JWT + bcryptjs |
| Icons     | Lucide React |

---

## 🗂️ Project Structure
```
early-logs-ims/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT protect + authorize
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Class.js
│   │   ├── Subject.js
│   │   ├── Attendance.js
│   │   ├── Assignment.js
│   │   ├── Fee.js
│   │   ├── Notice.js
│   │   ├── Exam.js
│   │   └── Timetable.js
│   ├── routes/               # Express route handlers
│   ├── seed/seed.js          # Demo data seeder
│   └── server.js             # Entry point
└── frontend/
    └── src/
        ├── api/axios.js      # Axios instance + interceptors
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── layout/       # Sidebar, Header, DashboardLayout
        │   └── common/       # StatCard, Modal, EmptyState...
        └── pages/
            ├── Login.jsx
            ├── admin/        # Dashboard, Users, Classes, Students, Fees, Notices
            ├── teacher/      # Dashboard, Attendance, Assignments
            ├── student/      # Dashboard, Attendance, Assignments, Exams
            ├── parent/       # Dashboard, Fees
            └── shared/       # Notices (shared across roles)
```

---

## ✅ MVP Features Implemented

### Admin
- [x] Dashboard with stats & charts
- [x] User Management (CRUD, role-based, activate/deactivate)
- [x] Class & Section Management
- [x] Student Management
- [x] Fee Management (collect, track, stats)
- [x] Notice Board (create, publish, delete)

### Teacher
- [x] Dashboard with quick actions
- [x] Mark Attendance (per class, bulk mark, status per student)
- [x] Assignments (create, view submissions, evaluate)

### Student
- [x] Personal Dashboard (attendance ring, assignments)
- [x] Attendance Tracker (monthly view, stats)
- [x] Assignments (view, submit, get feedback)
- [x] Exam Results

### Parent
- [x] Dashboard (overview)
- [x] Fee Tracking

### All Roles
- [x] JWT Authentication with role-based access
- [x] Notice Board (role-filtered)
- [x] Responsive UI (mobile + desktop)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/users | List users (admin) |
| POST | /api/users | Create user (admin) |
| GET | /api/classes | List classes |
| POST | /api/classes | Create class |
| GET | /api/students | List students |
| POST | /api/students | Create student |
| POST | /api/attendance | Mark attendance |
| GET | /api/attendance/my/attendance | My attendance |
| GET | /api/assignments/my/assignments | My assignments |
| POST | /api/assignments/:id/submit | Submit assignment |
| GET | /api/fees/my/fees | My fee records |
| GET | /api/notices | Get notices (role-filtered) |
| GET | /api/exams/my/results | My exam results |
