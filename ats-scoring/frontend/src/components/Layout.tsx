import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    ];

    switch (user.role) {
      case 'student':
        return [
          ...baseItems,
          { name: 'Jobs', href: '/jobs', icon: '💼' },
          { name: 'My Applications', href: '/applications', icon: '📋' },
          { name: 'Resume Analysis', href: '/analysis', icon: '📊' },
        ];
      case 'recruiter':
        return [
          ...baseItems,
          { name: 'Recruiter Dashboard', href: '/recruiter', icon: '💼' },
        ];
      case 'admin':
        return [
          ...baseItems,
          { name: 'Admin Dashboard', href: '/admin', icon: '👑' },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="/dashboard">
            ATS Scoring
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              {navigationItems.map((item) => (
                <li key={item.name} className="nav-item">
                  <a
                    className={`nav-link ${
                      location.pathname === item.href ? 'active fw-semibold' : ''
                    }`}
                    href={item.href}
                  >
                    <span className="me-2">{item.icon}</span>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
            <div className="d-flex align-items-center">
              <span className="text-muted me-3">
                Welcome, <span className="fw-medium">{user?.name}</span>
              </span>
              <span className="badge bg-primary me-3">{user?.role}</span>
              <button
                onClick={handleLogout}
                className="btn btn-outline-secondary btn-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container-fluid py-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
