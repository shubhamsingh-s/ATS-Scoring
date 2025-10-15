import React, { useState } from 'react';
import { usersAPI } from '../services/api';
import { User } from '../types';

interface UserManagementCardProps {
  user: User;
  onUserUpdated: () => void;
  onUserDeleted: (userId: number) => void;
}

const UserManagementCard: React.FC<UserManagementCardProps> = ({ user, onUserUpdated, onUserDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(user.role);

  const handleRoleUpdate = async () => {
    setLoading(true);
    setError('');

    try {
      await usersAPI.updateUserRole(user.id, role as 'admin' | 'student' | 'recruiter');
      setIsEditing(false);
      onUserUpdated();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await usersAPI.deleteUser(user.id);
      onUserDeleted(user.id);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'recruiter':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          <p className="text-sm text-gray-500 mt-1">
            Joined: {new Date(user.created_at).toLocaleDateString()}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Jobs Posted</p>
              <p className="font-medium">{user.jobs_posted || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Applications</p>
              <p className="font-medium">{user.applications_made || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Resumes Analyzed</p>
              <p className="font-medium">{user.resumes_analyzed || 0}</p>
            </div>
          </div>
        </div>

        <div className="ml-6 flex-shrink-0">
          <div className="flex flex-col space-y-2">
            {isEditing ? (
              <>
                <select
                  aria-label={`Role for ${user.name}`}
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'student' | 'recruiter')}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="student">Student</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleRoleUpdate}
                  disabled={loading}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setRole(user.role);
                  }}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  Edit Role
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementCard;
