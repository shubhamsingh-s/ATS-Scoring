import React, { useState } from 'react';
import { applicationsAPI } from '../services/api';
import { Application } from '../types';

interface ApplicantCardProps {
  applicant: Application;
  onStatusUpdate: (applicationId: number, status: 'applied' | 'shortlisted' | 'rejected') => void;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (status: 'applied' | 'shortlisted' | 'rejected') => {
    setUpdating(true);
    try {
      await applicationsAPI.updateApplicationStatus(applicant.id, status);
      onStatusUpdate(applicant.id, status);
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">
              {applicant.student_name}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(applicant.status)}`}>
              {applicant.status}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">{applicant.student_email}</p>
          <p className="text-sm text-gray-500 mt-1">
            Applied on {new Date(applicant.applied_at).toLocaleDateString()}
          </p>

          {applicant.ats_score && (
            <div className="mt-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">ATS Score:</span>
                <span className={`text-lg font-bold ${getScoreColor(applicant.ats_score)}`}>
                  {applicant.ats_score}%
                </span>
              </div>
              
              {applicant.matched_keywords && applicant.matched_keywords.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Matched Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {applicant.matched_keywords.slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {applicant.matched_keywords.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{applicant.matched_keywords.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {applicant.missing_keywords && applicant.missing_keywords.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Missing Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {applicant.missing_keywords.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {skill.replace('SKILL:', '')}
                      </span>
                    ))}
                    {applicant.missing_keywords.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{applicant.missing_keywords.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ml-6 flex-shrink-0">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleStatusUpdate('shortlisted')}
              disabled={updating || applicant.status === 'shortlisted'}
              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Shortlist'}
            </button>
            
            <button
              onClick={() => handleStatusUpdate('rejected')}
              disabled={updating || applicant.status === 'rejected'}
              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Reject'}
            </button>

            {applicant.resume_url && (
              <a
                href={`http://localhost:5000/uploads/${applicant.resume_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 text-center"
              >
                View Resume
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantCard;
