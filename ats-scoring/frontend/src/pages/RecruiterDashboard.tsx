import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobsAPI, applicationsAPI } from '../services/api';
import { Job, Application } from '../types';
import JobPostForm from '../components/JobPostForm';
import JobManagementCard from '../components/JobManagementCard';
import ApplicantCard from '../components/ApplicantCard';

const RecruiterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'post' | 'applicants'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getRecruiterJobs(1, 50);
      const data = response.data.data;
      if (data) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId: number) => {
    try {
      const response = await applicationsAPI.getJobApplicants(jobId);
      const data = response.data.data;
      if (data) {
        setApplicants(data.applicants);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    }
  };

  const handleJobCreated = (job: Job) => {
    setJobs([job, ...jobs]);
    setShowJobForm(false);
    setActiveTab('jobs');
  };

  const handleJobUpdated = () => {
    fetchJobs();
  };

  const handleJobDeleted = (jobId: number) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    fetchApplicants(job.id);
    setActiveTab('applicants');
  };

  const handleStatusUpdate = (applicationId: number, status: 'applied' | 'shortlisted' | 'rejected') => {
    setApplicants(applicants.map(app => 
      app.id === applicationId ? { ...app, status } : app
    ));
  };

  const tabs = [
    { id: 'jobs', name: 'My Jobs', icon: '💼' },
    { id: 'post', name: 'Post Job', icon: '➕' },
    { id: 'applicants', name: 'Applicants', icon: '👥' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your job postings and view applicants
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">💼</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Jobs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {jobs.length}
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
                <span className="text-3xl">📋</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Applications
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {jobs.reduce((sum, job) => sum + (job.application_count || 0), 0)}
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
                <span className="text-3xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Jobs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {jobs.filter(job => job.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'jobs' | 'post' | 'applicants');
                  if (tab.id === 'post') {
                    setShowJobForm(true);
                  } else {
                    setShowJobForm(false);
                  }
                }}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">My Job Postings</h3>
                <button
                  onClick={() => {
                    setActiveTab('post');
                    setShowJobForm(true);
                  }}
                  className="btn-primary"
                >
                  Post New Job
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">💼</span>
                  <p className="text-gray-500">No jobs posted yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Post New Job" to create your first job posting.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              job.status === 'active' ? 'bg-green-100 text-green-800' :
                              job.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                          <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                          {job.salary && (
                            <p className="text-sm text-green-600 font-medium mt-1">{job.salary}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                          <div className="mt-3 text-sm text-gray-500">
                            <p>Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                            <p>Applications: {job.application_count || 0}</p>
                          </div>
                        </div>
                        <div className="ml-6 flex-shrink-0">
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleJobSelect(job)}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                            >
                              View Applicants
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('post');
                                setShowJobForm(true);
                              }}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                            >
                              Edit Job
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post Job Tab */}
          {activeTab === 'post' && (
            <div>
              {showJobForm ? (
                <JobPostForm
                  onJobCreated={handleJobCreated}
                  onCancel={() => {
                    setShowJobForm(false);
                    setActiveTab('jobs');
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">➕</span>
                  <p className="text-gray-500">Ready to post a new job?</p>
                  <button
                    onClick={() => setShowJobForm(true)}
                    className="btn-primary mt-4"
                  >
                    Create Job Posting
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Applicants Tab */}
          {activeTab === 'applicants' && (
            <div className="space-y-4">
              {selectedJob ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Applicants for "{selectedJob.title}"
                      </h3>
                      <p className="text-sm text-gray-500">
                        {applicants.length} applications received
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="btn-secondary"
                    >
                      Back to Jobs
                    </button>
                  </div>

                  {applicants.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl mb-4 block">👥</span>
                      <p className="text-gray-500">No applications yet.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Applications will appear here when students apply.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applicants.map((applicant) => (
                        <ApplicantCard
                          key={applicant.id}
                          applicant={applicant}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">👥</span>
                  <p className="text-gray-500">Select a job to view applicants.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Go to "My Jobs" and click "View Applicants" on any job.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
