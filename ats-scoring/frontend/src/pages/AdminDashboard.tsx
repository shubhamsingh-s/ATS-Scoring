import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, jobsAPI, applicationsAPI } from '../services/api';
import { User, Job, Application, PlatformStats, PaginationInfo } from '../types';
import UserManagementCard from '../components/UserManagementCard';
import PlatformStatsComponent from '../components/PlatformStatsComponent';
import ActivityLogsComponent from '../components/ActivityLogsComponent';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'applications' | 'logs'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<Array<{ role: string; count: number }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ date: string; count: number }>>([]);
  const [topSkills, setTopSkills] = useState<Array<{ skills: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [userPagination, setUserPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [jobPagination, setJobPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [applicationPagination, setApplicationPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchPlatformStats();
    fetchUsers();
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await usersAPI.getPlatformStats();
      const data = response.data.data;
      if (data) {
        setPlatformStats(data.stats);
        setRoleDistribution(data.roleDistribution);
        setRecentActivity(data.recentActivity);
        setTopSkills(data.topSkills);
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers(page, 10);
      const data = response.data.data;
      if (data) {
        setUsers(data.users);
        setUserPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (page = 1) => {
    try {
      const response = await jobsAPI.getAllJobs(page, 10);
      const data = response.data.data;
      if (data) {
        setJobs(data.jobs);
        setJobPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async (page = 1) => {
    try {
      const response = await applicationsAPI.getAllApplications(page, 10);
      const data = response.data.data;
      if (data) {
        setApplications(data.applications);
        setApplicationPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleUserUpdated = () => {
    fetchUsers(userPagination.currentPage);
    fetchPlatformStats();
  };

  const handleUserDeleted = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
    fetchPlatformStats();
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'jobs', name: 'Jobs', icon: '💼' },
    { id: 'applications', name: 'Applications', icon: '📋' },
    { id: 'logs', name: 'Activity Logs', icon: '📝' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users, jobs, and platform analytics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
          {/* Overview Tab */}
          {activeTab === 'overview' && platformStats && (
            <PlatformStatsComponent
              stats={platformStats}
              roleDistribution={roleDistribution}
              recentActivity={recentActivity}
              topSkills={topSkills}
            />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <button
                  onClick={() => fetchUsers(userPagination.currentPage)}
                  className="btn-secondary"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">👥</span>
                  <p className="text-gray-500">No users found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <UserManagementCard
                      key={user.id}
                      user={user}
                      onUserUpdated={handleUserUpdated}
                      onUserDeleted={handleUserDeleted}
                    />
                  ))}
                </div>
              )}

              {/* User Pagination */}
              {userPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {userPagination.currentPage} of {userPagination.totalPages}
                    ({userPagination.totalItems} total users)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchUsers(userPagination.currentPage - 1)}
                      disabled={!userPagination.hasPrev}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchUsers(userPagination.currentPage + 1)}
                      disabled={!userPagination.hasNext}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">All Jobs</h3>
                <button
                  onClick={() => fetchJobs(jobPagination.currentPage)}
                  className="btn-secondary"
                >
                  Refresh
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">💼</span>
                  <p className="text-gray-500">No jobs found.</p>
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
                            <p>Posted by: {job.recruiter_name}</p>
                            <p>Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                            <p>Applications: {job.application_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Job Pagination */}
              {jobPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {jobPagination.currentPage} of {jobPagination.totalPages}
                    ({jobPagination.totalItems} total jobs)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchJobs(jobPagination.currentPage - 1)}
                      disabled={!jobPagination.hasPrev}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchJobs(jobPagination.currentPage + 1)}
                      disabled={!jobPagination.hasNext}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">All Applications</h3>
                <button
                  onClick={() => fetchApplications(applicationPagination.currentPage)}
                  className="btn-secondary"
                >
                  Refresh
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p className="text-gray-500">No applications found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">{application.job_title}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {application.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Applicant: {application.student_name} ({application.student_email})
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Recruiter: {application.recruiter_name}
                          </p>
                          {application.ats_score && (
                            <p className="text-sm text-primary-600 font-medium mt-1">
                              ATS Score: {application.ats_score}%
                            </p>
                          )}
                          <div className="mt-3 text-sm text-gray-500">
                            <p>Applied: {new Date(application.applied_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Application Pagination */}
              {applicationPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {applicationPagination.currentPage} of {applicationPagination.totalPages}
                    ({applicationPagination.totalItems} total applications)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchApplications(applicationPagination.currentPage - 1)}
                      disabled={!applicationPagination.hasPrev}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchApplications(applicationPagination.currentPage + 1)}
                      disabled={!applicationPagination.hasNext}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'logs' && <ActivityLogsComponent />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
