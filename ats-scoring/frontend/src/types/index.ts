export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'recruiter';
  created_at: string;
  jobs_posted?: number;
  applications_made?: number;
  resumes_analyzed?: number;
}

export interface Job {
  id: number;
  recruiter_id: number;
  title: string;
  description: string;
  skills?: string;
  experience?: string;
  salary?: string;
  location?: string;
  company?: string;
  status: 'active' | 'inactive' | 'closed';
  created_at: string;
  updated_at: string;
  recruiter_name?: string;
  recruiter_email?: string;
  application_count?: number;
  matched_skills?: string[];
  match_score?: number;
}

export interface Application {
  id: number;
  job_id: number;
  student_id: number;
  resume_url?: string;
  ats_score?: number;
  status: 'applied' | 'shortlisted' | 'rejected';
  applied_at: string;
  updated_at: string;
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  recruiter_name?: string;
  student_name?: string;
  student_email?: string;
  job_title?: string;
  matched_keywords?: string[];
  missing_keywords?: string[];
  recommendations?: Recommendation[];
}

export interface ResumeAnalysis {
  id: number;
  student_id: number;
  resume_url: string;
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  recommendations: Recommendation[];
  analysis_data: AnalysisData;
  created_at: string;
}

export interface Recommendation {
  title: string;
  text: string;
  examples: string[];
}

export interface AnalysisData {
  score: number;
  breakdown: {
    skills?: {
      match: string[];
      required: string[];
      score: number;
    };
    keywords?: {
      required: string[];
      matched: string[];
      score: number;
    };
    degree?: {
      match: string[];
      required: string[];
      score: number;
    };
    designation?: {
      match_count: number;
      score: number;
    };
    contact?: {
      present: string[];
      score: number;
    };
  };
  entities: {
    EMAIL: string[];
    PHONE: string[];
    LINKEDIN: string[];
    SKILLS: string[];
    DEGREE: string[];
    DESIGNATION: string[];
  };
  missing: string[];
  recommendations: Recommendation[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'student' | 'recruiter') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PlatformStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  totalAnalyses: number;
  averageATSScore: number;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  action: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}
