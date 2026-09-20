import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from './AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Navbar } from './components/Navbar';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold">Resume Analysis Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">SQLITE_DB: ACTIVE</div>
            <Link to="/dashboard" className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition">New Analysis</Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        <footer className="h-8 flex-shrink-0 bg-slate-200 border-t border-slate-300 px-6 flex items-center justify-between text-[10px] text-slate-500">
          <div>Project: Resume Analyzer System | Node v20 | SQLite | pdf-parse</div>
          <div className="flex gap-4">
            <span>Database: database.db</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Server Ready</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Main App Component
function AppContents() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContents />
    </AuthProvider>
  );
}
