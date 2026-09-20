export interface User {
  username: string;
  token: string;
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
}

export interface HistoryItem {
  id: number;
  filename: string;
  ats_score: number;
  match_percentage: number | null;
  sections_found: Record<string, boolean>;
  missing_skills: string[];
  suggestions: string[];
  created_at: string;
}
