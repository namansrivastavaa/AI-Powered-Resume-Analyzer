import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../AuthContext';
import { UploadCloud, CheckCircle, XCircle, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { AnalysisResult } from '../types';

export function Dashboard() {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a resume PDF to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);
    if (jdText) {
      formData.append('jdText', jdText);
    }

    try {
      const token = user?.token || localStorage.getItem('token') || '';
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Response was not JSON
      }
      
      if (res.ok && data) {
        setResult(data);
      } else {
        setError(data?.error || `Analysis failed (${res.status}: ${res.statusText || 'Server error'}).`);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error. Unable to analyze document.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="p-8 flex-1 flex flex-col w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analyzer Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Upload your resume and optional job description for instant ATS feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Column */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              1. Upload Resume (PDF)
            </h2>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:bg-slate-50 hover:border-indigo-400 transition cursor-pointer text-center flex flex-col items-center justify-center min-h-[160px]"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
              {file ? (
                <p className="text-indigo-600 font-medium text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-slate-600 text-sm font-medium mb-1">Drag and drop your PDF</p>
                  <p className="text-xs text-slate-400">or click to browse</p>
                </>
              )}
            </div>
            {error && <p className="text-rose-500 text-xs mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1">
            <h2 className="text-sm font-bold text-slate-800 mb-4">
              2. Paste Job Description (Optional)
            </h2>
            <textarea
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[140px] resize-y text-sm text-slate-700"
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-medium text-sm py-3 rounded-lg shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>Analyze Resume <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Results Column */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 min-h-[500px]">
            <h2 className="text-slate-800 text-sm font-bold mb-6">Analysis Results</h2>
            
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-[350px] text-slate-400">
                <UploadCloud className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Upload a resume to begin analysis</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-[350px] text-indigo-500 animate-pulse">
                <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium">Parsing PDF and scoring sections...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Score Display (Left inside results) */}
                  <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-200 rounded-xl">
                    <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4">ATS Optimization Score</h3>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-200" />
                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="351.858" strokeDashoffset={351.858 - (351.858 * result.score) / 100} className={result.score >= 80 ? "text-emerald-500" : result.score >= 50 ? "text-amber-500" : "text-rose-500"} />
                      </svg>
                      <div className="absolute flex flex-col items-center mt-1">
                        <span className="text-3xl font-bold text-slate-800">{result.score}</span>
                        <span className="text-slate-400 text-[10px] font-semibold tracking-wide">OUT OF 100</span>
                      </div>
                    </div>
                  </div>

                  {/* Sections Found */}
                  <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="text-slate-800 text-sm font-bold mb-4">Section Checklist</h3>
                    <ul className="space-y-3">
                      {Object.entries(result.sectionsFound).map(([section, found]) => (
                        <li key={section} className="flex items-center gap-3 text-sm">
                          {found ? (
                            <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">✓</span>
                          ) : (
                            <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">!</span>
                          )}
                          <span className="capitalize text-slate-700">{section} Section</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* JD Match Percentage */}
                {result.matchPercentage !== null && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-slate-800 font-bold text-sm">Job Description Comparison</h3>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium italic">NLP Match</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 mb-6">
                      <div>
                        {result.missingSkills.length > 0 && (
                          <>
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-2">Missing Keywords</p>
                            <div className="flex flex-wrap gap-2">
                              {result.missingSkills.map(skill => (
                                <span key={skill} className="px-3 py-1 bg-rose-50 text-rose-600 rounded text-xs border border-rose-100">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                        {result.missingSkills.length === 0 && <p className="text-xs text-slate-500">No missing keywords found.</p>}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Overall Match Percentage</span>
                        <span className="text-sm font-bold text-indigo-600">{result.matchPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${result.matchPercentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
                  <h3 className="text-indigo-900 font-bold mb-3 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Improvement Suggestions
                  </h3>
                  {result.suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.suggestions.map((suggestion, i) => (
                        <div key={i} className="bg-white p-3 rounded border border-indigo-200 text-sm">
                          <p className="text-slate-700 text-xs">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-indigo-700 text-xs italic">No major structural suggestions. Keep tweaking content for specific JD targets.</p>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
