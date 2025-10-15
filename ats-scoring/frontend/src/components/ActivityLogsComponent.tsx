import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { ActivityLog, PaginationInfo } from '../types';

const ActivityLogsComponent: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [pagination.currentPage, selectedUserId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getActivityLogs(pagination.currentPage, 20, selectedUserId);
      const data = response.data.data;
      if (data) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return '🔐';
      case 'register':
        return '📝';
      case 'job_created':
        return '➕';
      case 'job_updated':
        return '✏️';
      case 'job_deleted':
        return '🗑️';
      case 'job_applied':
        return '📋';
      case 'application_updated':
        return '🔄';
      case 'resume_scored':
        return '📊';
      case 'user_role_updated':
        return '👤';
      case 'user_deleted':
        return '❌';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'text-green-600 bg-green-100';
      case 'register':
        return 'text-blue-600 bg-blue-100';
      case 'job_created':
        return 'text-purple-600 bg-purple-100';
      case 'job_updated':
        return 'text-yellow-600 bg-yellow-100';
      case 'job_deleted':
        return 'text-red-600 bg-red-100';
      case 'job_applied':
        return 'text-indigo-600 bg-indigo-100';
      case 'application_updated':
        return 'text-orange-600 bg-orange-100';
      case 'resume_scored':
        return 'text-pink-600 bg-pink-100';
      case 'user_role_updated':
        return 'text-cyan-600 bg-cyan-100';
      case 'user_deleted':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="userFilter" className="label">
                Filter by User
              </label>
              <input
                type="text"
                id="userFilter"
                className="input-field"
                placeholder="Enter user ID or leave empty for all"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                  fetchLogs();
                }}
                className="btn-primary"
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Logs</h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">📝</span>
              <p className="text-gray-500">No activity logs found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getActionIcon(log.action)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {log.user_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          User: <span className="font-medium">{log.user_name}</span>
                          {log.user_email && (
                            <span className="text-gray-500"> ({log.user_email})</span>
                          )}
                        </p>
                      )}
                      
                      {log.details && (
                        <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                      )}
                      
                      {log.ip_address && (
                        <p className="text-xs text-gray-400 mt-1">
                          IP: {log.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages}
                ({pagination.totalItems} total logs)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsComponent;
