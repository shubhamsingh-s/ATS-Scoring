import React, { useState } from 'react';
import { jobsAPI } from '../services/api';
import { Job } from '../types';

interface JobManagementCardProps {
  job: Job;
  onJobUpdated: () => void;
  onJobDeleted: (jobId: number) => void;
}

const JobManagementCard: React.FC<JobManagementCardProps> = ({ job, onJobUpdated, onJobDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: job.title,
    description: job.description,
    skills: job.skills || '',
    experience: job.experience || '',
    salary: job.salary || '',
    location: job.location || '',
    company: job.company || '',
    status: job.status
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await jobsAPI.updateJob(job.id, formData);
      setIsEditing(false);
      onJobUpdated();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await jobsAPI.deleteJob(job.id);
      onJobDeleted(job.id);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Job</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="label">Job Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="input-field"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="company" className="label">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                className="input-field"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="label">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className="input-field"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="salary" className="label">Salary</label>
              <input
                type="text"
                id="salary"
                name="salary"
                className="input-field"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="label">Status</label>
            <select
              id="status"
              name="status"
              className="input-field"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label htmlFor="skills" className="label">Skills</label>
            <input
              type="text"
              id="skills"
              name="skills"
              className="input-field"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="input-field"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
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
          
          {job.skills && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {job.skills.split(',').slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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
          
          <div className="mt-3 text-sm text-gray-500">
            <p>Posted: {new Date(job.created_at).toLocaleDateString()}</p>
            <p>Applications: {job.application_count || 0}</p>
          </div>
        </div>

        <div className="ml-6 flex-shrink-0">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
            >
              Edit
            </button>
            
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobManagementCard;
