import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { HistoryItem } from '../types';
import { Clock, FileText, BarChart2, Calendar, Sparkles } from 'lucide-react';

export function History() {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = user?.token || localStorage.getItem('token') || '';
        const res = await fetch('/api/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // Non JSON
        }
        
        if (res.ok && data) {
          setHistory(data);
        } else {
          setError(data?.error || `Failed to fetch history (${res.status})`);
        }
      } catch (err: any) {
        setError(err?.message || 'Network error syncing database history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  return (
    <div className="p-8 flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-indigo-100 p-3 rounded-xl border border-indigo-200">
          <Clock className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analysis History</h1>
          <p className="text-slate-500 text-sm mt-1">View your past resume evaluations stored in the SQLite database.</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}

      {error && <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl text-sm">{error}</div>}

      {!loading && !error && history.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No History Found</h3>
          <p className="text-slate-500 mt-1 text-xs">Upload and analyze a resume in the dashboard to see history here.</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="space-y-4">
          {history.map((record) => (
            <div key={record.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-md transition">
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">{record.filename}</h3>
                  {record.ai_insights && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(record.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Analysis ID: #{record.id}</span>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
                {record.match_percentage !== null && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex-1 md:w-32 text-center">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">JD Match</div>
                    <div className="text-lg font-bold text-indigo-600">{record.match_percentage}%</div>
                  </div>
                )}
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex-1 md:w-32 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">ATS Score</div>
                  <div className={`text-lg font-bold ${record.ats_score >= 80 ? 'text-emerald-500' : record.ats_score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {record.ats_score}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
