import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { atsAPI, jobsAPI } from '../services/api';
import { ResumeAnalysis, Job, AnalysisData } from '../types';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysesResponse, recommendationsResponse] = await Promise.all([
          atsAPI.getAnalysisHistory(),
          atsAPI.getJobRecommendations()
        ]);
        
        setAnalyses(analysesResponse.data.data?.analyses || []);
        setRecommendations(recommendationsResponse.data.data?.jobs || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's your ATS scoring dashboard and job recommendations.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">📊</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resume Analyses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analyses.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">💼</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Job Recommendations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {recommendations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">📈</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average ATS Score
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analyses.length > 0 
                      ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.ats_score, 0) / analyses.length)
                      : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Resume Analyses
          </h3>
          {analyses.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-4xl mb-4 block">📄</span>
              <p className="text-gray-500">No resume analyses yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload your resume to get started with ATS scoring.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.slice(0, 3).map((analysis) => (
                <div key={analysis.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Resume Analysis #{analysis.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        analysis.ats_score >= 80 ? 'text-green-600' :
                        analysis.ats_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {analysis.ats_score}%
                      </div>
                      <p className="text-xs text-gray-500">ATS Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Recommendations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recommended Jobs
          </h3>
          {recommendations.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-4xl mb-4 block">🔍</span>
              <p className="text-gray-500">No job recommendations available.</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload your resume to get personalized job recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.slice(0, 5).map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
                      <p className="text-sm text-gray-600">{job.company}</p>
                      <p className="text-sm text-gray-500">{job.location}</p>
                      {job.salary && (
                        <p className="text-sm text-green-600 font-medium">{job.salary}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {job.match_score}%
                      </div>
                      <p className="text-xs text-gray-500">Match Score</p>
                    </div>
                  </div>
                  {job.matched_skills && job.matched_skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Matched Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.matched_skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
