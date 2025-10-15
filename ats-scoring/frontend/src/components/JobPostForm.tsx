import React, { useState } from 'react';
import { jobsAPI } from '../services/api';
import { Job } from '../types';

interface JobPostFormProps {
  onJobCreated: (job: Job) => void;
  onCancel: () => void;
}

const JobPostForm: React.FC<JobPostFormProps> = ({ onJobCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    experience: '',
    salary: '',
    location: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await jobsAPI.createJob(formData);
      if (response.data.data?.job) {
        onJobCreated(response.data.data.job);
        setFormData({
          title: '',
          description: '',
          skills: '',
          experience: '',
          salary: '',
          location: '',
          company: ''
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create job');
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Post New Job</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="label">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="input-field"
                placeholder="e.g., Senior Software Engineer"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="company" className="label">
                Company Name
              </label>
              <input
                type="text"
                id="company"
                name="company"
                className="input-field"
                placeholder="e.g., Tech Corp"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="label">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="input-field"
                placeholder="e.g., San Francisco, CA"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="salary" className="label">
                Salary Range
              </label>
              <input
                type="text"
                id="salary"
                name="salary"
                className="input-field"
                placeholder="e.g., $80,000 - $120,000"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="experience" className="label">
              Experience Required
            </label>
            <select
              id="experience"
              name="experience"
              className="input-field"
              value={formData.experience}
              onChange={handleChange}
            >
              <option value="">Select experience level</option>
              <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
              <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
              <option value="Senior Level (6-10 years)">Senior Level (6-10 years)</option>
              <option value="Lead Level (10+ years)">Lead Level (10+ years)</option>
            </select>
          </div>

          <div>
            <label htmlFor="skills" className="label">
              Required Skills
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              className="input-field"
              placeholder="e.g., JavaScript, React, Node.js, Python"
              value={formData.skills}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate skills with commas
            </p>
          </div>

          <div>
            <label htmlFor="description" className="label">
              Job Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              className="input-field"
              placeholder="Describe the role, responsibilities, and requirements..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostForm;
