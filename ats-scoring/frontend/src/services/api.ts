import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Job, 
  Application, 
  ResumeAnalysis, 
  ApiResponse, 
  PaginationInfo,
  PlatformStats,
  ActivityLog,
  AnalysisData
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<AxiosResponse<ApiResponse<{ token: string; user: User }>>> =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, role: 'student' | 'recruiter'): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.post('/auth/register', { name, email, password, role }),
  
  getProfile: (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.get('/auth/profile'),
  
  updateProfile: (name: string): Promise<AxiosResponse<ApiResponse<{}>>> =>
    api.put('/auth/profile', { name }),
};

// Jobs API
export const jobsAPI = {
  getAllJobs: (page = 1, limit = 10, search = ''): Promise<AxiosResponse<ApiResponse<{ jobs: Job[]; pagination: PaginationInfo }>>> =>
    api.get(`/jobs?page=${page}&limit=${limit}&search=${search}`),
  
  getJobById: (jobId: number): Promise<AxiosResponse<ApiResponse<{ job: Job }>>> =>
    api.get(`/jobs/${jobId}`),
  
  createJob: (jobData: Partial<Job>): Promise<AxiosResponse<ApiResponse<{ job: Job }>>> =>
    api.post('/jobs', jobData),
  
  getRecruiterJobs: (page = 1, limit = 10): Promise<AxiosResponse<ApiResponse<{ jobs: Job[]; pagination: PaginationInfo }>>> =>
    api.get(`/jobs/recruiter/my-jobs?page=${page}&limit=${limit}`),
  
  updateJob: (jobId: number, jobData: Partial<Job>): Promise<AxiosResponse<ApiResponse<{}>>> =>
    api.put(`/jobs/${jobId}`, jobData),
  
  deleteJob: (jobId: number): Promise<AxiosResponse<ApiResponse<{}>>> =>
    api.delete(`/jobs/${jobId}`),
};

// Applications API
export const applicationsAPI = {
  applyForJob: (jobId: number): Promise<AxiosResponse<ApiResponse<{ application: Application }>>> =>
    api.post('/applications/apply', { jobId }),
  
  getStudentApplications: (page = 1, limit = 10): Promise<AxiosResponse<ApiResponse<{ applications: Application[]; pagination: PaginationInfo }>>> =>
    api.get(`/applications/my-applications?page=${page}&limit=${limit}`),
  
  getJobApplicants: (jobId: number): Promise<AxiosResponse<ApiResponse<{ applicants: Application[] }>>> =>
    api.get(`/applications/job/${jobId}/applicants`),
  
  updateApplicationStatus: (applicationId: number, status: 'applied' | 'shortlisted' | 'rejected'): Promise<AxiosResponse<ApiResponse<{}>>> =>
    api.put(`/applications/${applicationId}/status`, { status }),
  
  getAllApplications: (page = 1, limit = 10): Promise<AxiosResponse<ApiResponse<{ applications: Application[]; pagination: PaginationInfo }>>> =>
    api.get(`/applications/all?page=${page}&limit=${limit}`),
};

// ATS API
export const atsAPI = {
  scoreResume: (file: File, jobDescription: string, jobId?: number): Promise<AxiosResponse<ApiResponse<{ analysis: AnalysisData & { analysisId: number } }>>> => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);
    if (jobId) {
      formData.append('jobId', jobId.toString());
    }
    
    return api.post('/ats/score', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getAnalysisHistory: (): Promise<AxiosResponse<ApiResponse<{ analyses: ResumeAnalysis[] }>>> =>
    api.get('/ats/history'),
  
  getAnalysisDetails: (analysisId: number): Promise<AxiosResponse<ApiResponse<{ analysis: ResumeAnalysis }>>> =>
    api.get(`/ats/analysis/${analysisId}`),
  
  getJobRecommendations: (): Promise<AxiosResponse<ApiResponse<{ jobs: Job[] }>>> =>
    api.get('/ats/recommendations'),
};

// Users API (Admin only)
export const usersAPI = {
  getAllUsers: (page = 1, limit = 10, role = '', search = ''): Promise<AxiosResponse<ApiResponse<{ users: User[]; pagination: PaginationInfo }>>> =>
    api.get(`/users?page=${page}&limit=${limit}&role=${role}&search=${search}`),
  
  getUserById: (userId: number): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.get(`/users/${userId}`),
  
  updateUserRole: (userId: number, role: 'admin' | 'student' | 'recruiter'): Promise<AxiosResponse<ApiResponse<{}>>> =>
    api.put(`/users/${userId}/role`, { role }),
  
  deleteUser: (userId: number): Promise<AxiosResponse<ApiResponse<{}>>> =>
    api.delete(`/users/${userId}`),
  
  getPlatformStats: (): Promise<AxiosResponse<ApiResponse<{ stats: PlatformStats; roleDistribution: Array<{ role: string; count: number }>; recentActivity: Array<{ date: string; count: number }>; topSkills: Array<{ skills: string; count: number }> }>>> =>
    api.get('/users/stats'),
  
  getActivityLogs: (page = 1, limit = 20, userId = ''): Promise<AxiosResponse<ApiResponse<{ logs: ActivityLog[]; pagination: PaginationInfo }>>> =>
    api.get(`/users/logs?page=${page}&limit=${limit}&userId=${userId}`),
};

export default api;
