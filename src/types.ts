export interface User {
  username: string;
  token: string;
}

export interface AISectionDetection {
  education: boolean;
  skills: boolean;
  projects: boolean;
  experience: boolean;
  certifications: boolean;
  links: boolean;
}

export interface AIJdMatch {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export interface AIInsights {
  summary: string;
  skills: string[];
  sections: AISectionDetection;
  strengths: string[];
  improvements: string[];
  jdMatch: AIJdMatch | null;
}

export interface AnalysisResult {
  score: number;
  sectionsFound: {
    education: boolean;
    skills: boolean;
    projects: boolean;
    experience: boolean;
    certifications: boolean;
    links: boolean;
  };
  suggestions: string[];
  matchPercentage: number | null;
  missingSkills: string[];
  aiInsights: AIInsights | null;
  aiEnabled: boolean;
}

export interface HistoryItem {
  id: number;
  filename: string;
  ats_score: number;
  match_percentage: number | null;
  sections_found: Record<string, boolean>;
  missing_skills: string[];
  suggestions: string[];
  ai_insights: AIInsights | null;
  created_at: string;
}
