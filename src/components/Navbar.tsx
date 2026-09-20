import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { FileSearch, LogOut, LayoutDashboard, History as HistoryIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;

  return (
    <aside className="w-64 bg-indigo-900 text-white flex flex-col border-r border-indigo-800 flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
            <span className="font-bold text-lg">AI</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Analyzer v1.0</h1>
        </div>
        <nav className="space-y-2">
          <Link
            to="/dashboard"
            className={clsx(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              location.pathname === '/dashboard' 
                ? "bg-indigo-800" 
                : "text-indigo-300 hover:bg-indigo-800"
            )}
          >
            <div className={clsx("w-4 h-4 border-2 rounded-full", location.pathname === '/dashboard' ? "border-white" : "border-indigo-400 rounded-sm")}></div>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            to="/history"
            className={clsx(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              location.pathname === '/history' 
                ? "bg-indigo-800" 
                : "text-indigo-300 hover:bg-indigo-800"
            )}
          >
            <div className={clsx("w-4 h-4 border-2", location.pathname === '/history' ? "border-white rounded-full" : "border-indigo-400")}></div>
            <span className="font-medium">Analysis History</span>
          </Link>
        </nav>
      </div>
      <div className="mt-auto p-6 border-t border-indigo-800">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-indigo-400">Student Admin</p>
            </div>
          </div>
          <button onClick={logout} className="text-indigo-400 hover:text-white transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
