import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../services/api';
import { Job, Application } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Jobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applyingToJob, setApplyingToJob] = useState<number | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [currentPage, searchTerm]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAllJobs(currentPage, 10, searchTerm);
      const data = response.data.data;
      if (data) {
        setJobs(data.jobs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: number) => {
    if (!user || user.role !== 'student') return;
    
    try {
      setApplyingToJob(jobId);
      await applicationsAPI.applyForJob(jobId);
      alert('Application submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply for job');
    } finally {
      setApplyingToJob(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Find your next career opportunity
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search jobs by title, company, or skills..."
                className="input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <span className="text-4xl mb-4 block">🔍</span>
              <p className="text-gray-500">No jobs found.</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search criteria.
              </p>
            </div>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="hover:text-primary-600"
                      >
                        {job.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                    <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                    
                    {job.salary && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        {job.salary}
                      </p>
                    )}

                    {job.skills && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.split(',').slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                          {job.skills.split(',').length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{job.skills.split(',').length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  <div className="ml-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {job.application_count || 0} applications
                      </p>
                      <p className="text-xs text-gray-400">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {user?.role === 'student' && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={applyingToJob === job.id}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {applyingToJob === job.id ? 'Applying...' : 'Apply Now'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
