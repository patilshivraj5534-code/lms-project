import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, BookOpen, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="glass-sidebar w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-display font-bold text-white">LMS Platform</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {!isInstructor && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300 hover:bg-white/5'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </NavLink>
              <NavLink
                to="/subjects"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-300 hover:bg-white/5'
                  }`
                }
              >
                <BookOpen className="w-5 h-5" />
                All Courses
              </NavLink>
            </>
          )}
          {isInstructor && (
            <NavLink
              to="/instructor"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300 hover:bg-white/5'
                }`
              }
            >
              <GraduationCap className="w-5 h-5" />
              Instructor Dashboard
            </NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
