import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../services/api';
import { Job } from '../types';
import { useAuth } from '../contexts/AuthContext';

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJobById(parseInt(id!));
      setJob(response.data.data?.job || null);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || user.role !== 'student' || !job) return;
    
    try {
      setApplying(true);
      await applicationsAPI.applyForJob(job.id);
      alert('Application submitted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply for job');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-gray-500">Job not found.</p>
          <Link to="/jobs" className="text-primary-600 hover:text-primary-500">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{job.company}</p>
              <p className="text-sm text-gray-500 mt-1">{job.location}</p>
              {job.salary && (
                <p className="text-lg text-green-600 font-medium mt-2">{job.salary}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Posted {new Date(job.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {job.application_count || 0} applications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          {job.skills && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.split(',').map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Experience */}
          {job.experience && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Experience Required</h3>
                <p className="text-gray-700">{job.experience}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Button */}
          {user?.role === 'student' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? 'Applying...' : 'Apply for this Job'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You'll be redirected to upload your resume
                </p>
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Company:</span> {job.company}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Location:</span> {job.location}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Posted by:</span> {job.recruiter_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Contact:</span> {job.recruiter_email}
                </p>
              </div>
            </div>
          </div>

          {/* Back to Jobs */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <Link
                to="/jobs"
                className="w-full btn-secondary text-center block"
              >
                ← Back to All Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
