// Minimal JS for future interactivity
document.addEventListener('DOMContentLoaded', function () {
  // Placeholder for small interactions (menu toggle etc.)
  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      document.querySelector('.nav-links').classList.toggle('open');
    });
  }
});
// Main JavaScript utilities and shared functions

// API Configuration
// Prefer an explicit override when available (useful if backend is on a different port).
const API_BASE_URL = (window.__API_BASE_URL || 'http://localhost:5000') + '/api';

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initializeTheme();

    // Initialize navigation
    initializeNavigation();

    // Check authentication status
    checkAuthStatus();

    // Initialize quick upload on homepage
    const quickUploadForm = document.getElementById('quickUploadForm');
    if (quickUploadForm) {
        quickUploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Require authentication
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Please login to upload your resume', 'warning');
                setTimeout(() => window.location.href = 'login.html', 800);
                return;
            }

            const fileInput = document.getElementById('resumeFileQuick');
            const jobDesc = document.getElementById('jobDescriptionQuick').value;
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                showToast('Please select a resume file', 'error');
                return;
            }

            const file = fileInput.files[0];
            const allowedTypes = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];
            if (!allowedTypes.includes(file.type) && file.size > (10 * 1024 * 1024)) {
                showToast('Invalid file type or file too large (max 10MB)', 'error');
                return;
            }

            const btn = document.getElementById('quickUploadBtn');
            showLoading(btn);

            try {
                const fd = new FormData();
                fd.append('resume', file);
                if (jobDesc) fd.append('jobDescription', jobDesc);

                const resp = await upload('/ats/score', fd);
                if (resp.success) {
                    const analysis = resp.data.analysis || resp.data;
                    showToast('Resume analyzed — results below', 'success');
                    renderAnalysis(analysis);
                } else {
                    showToast(resp.message || 'Analysis failed', 'error');
                }
            } catch (err) {
                console.error('Quick upload failed', err);
                showToast(err.message || 'Upload failed', 'error');
            } finally {
                hideLoading(btn);
            }
        });
    }
});

// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(themeToggle, savedTheme);

        // Theme toggle event
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(themeToggle, newTheme);

            showToast('Theme updated successfully', 'success');
        });
    }
}

// Render analysis object into the homepage container
function renderAnalysis(analysis) {
    // Normalise fields
    // analysis.score is expected to be a percentage value between 0 and 100.
    // Be defensive: prefer explicit numeric values and clamp to [0,100].
    let rawScore = 0;
    if (typeof analysis.score === 'number') rawScore = analysis.score;
    else if (typeof analysis.ats_score === 'number') rawScore = analysis.ats_score;
    else rawScore = Number(analysis.score) || Number(analysis.ats_score) || 0;
    const score = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));
    const matched = analysis.matched_keywords || analysis.matchedKeywords || analysis.breakdown?.skills?.match || [];
    const missing = analysis.missing_keywords || analysis.missingKeywords || analysis.missing || [];
    const recommendations = analysis.recommendations || analysis.recommendations || [];

    const container = document.getElementById('analysisContainer');
    if (!container) return;

    container.classList.remove('hidden');
    // Check persisted collapsed state
    const collapsed = localStorage.getItem('analysisCollapsed') === 'true';

    // Build HTML with an SVG circular progress for the score
    const pct = Math.max(0, Math.min(100, score));
    const radius = 56;
    const c = 2 * Math.PI * radius;
    const offset = c - (pct / 100) * c;

    container.innerHTML = `
        <div class="analysis-card ${collapsed ? 'collapsed' : ''}" id="analysisCard" role="region" aria-label="Resume analysis">
            <div class="card-header">
                <div style="display:flex;align-items:center;gap:1rem;">
                    <div class="score-ring" aria-hidden="false" title="Score ${pct}%">
                        <svg width="128" height="128" viewBox="0 0 128 128">
                            <defs></defs>
                            <circle cx="64" cy="64" r="${radius}" fill="none" stroke="#e6e9f8" stroke-width="12"></circle>
                            <circle id="progressCircle" cx="64" cy="64" r="${radius}" fill="none" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#0055FF'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
                        </svg>
                        <div class="score-value">${pct}%</div>
                    </div>
                    <div>
                        <h3 style="margin:0;">Resume Analysis</h3>
                        <div class="muted">Updated just now</div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-ghost" id="viewHistoryBtn">View history</button>
                    <button class="collapse-icon" id="toggleAnalysisBtn" aria-expanded="${!collapsed}" aria-controls="analysisBody">↕</button>
                </div>
            </div>
            <div class="analysis-body" id="analysisBody">
                <div><strong>Score:</strong> ${pct}%</div>
                <div style="margin-top:.5rem;"><strong>Matched Keywords</strong></div>
                <div class="keyword-list">${matched.map(k => `<span class="chip">${escapeHtml(String(k))}</span>`).join('')}</div>
                <div style="margin-top:.5rem;"><strong>Missing Keywords</strong></div>
                <div class="keyword-list">${missing.length ? missing.map(k => `<span class="chip missing">${escapeHtml(String(k))}</span>`).join('') : '<span class="muted">None detected</span>'}</div>
                <div style="margin-top:.75rem;"><strong>Recommendations</strong></div>
                <div>${recommendations.length ? recommendations.map(r => {
                    const title = escapeHtml(r.title || r);
                    const text = escapeHtml(r.text || '');
                    const examples = (r.examples || []).map(e => `<li>${escapeHtml(e)}</li>`).join('');
                    return `<div class="recommendation"><strong>${title}</strong><div>${text}</div>${examples ? `<ul>${examples}</ul>` : ''}</div>`;
                }).join('') : '<div class="muted">No recommendations available</div>'}</div>
            </div>
        </div>
    `;

    // Wire up buttons
    const toggleBtn = document.getElementById('toggleAnalysisBtn');
    const analysisCard = document.getElementById('analysisCard');
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');

    if (toggleBtn && analysisCard) {
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = analysisCard.classList.toggle('collapsed');
            localStorage.setItem('analysisCollapsed', isCollapsed ? 'true' : 'false');
            toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
            const body = document.getElementById('analysisBody');
            if (body) body.style.display = isCollapsed ? 'none' : 'block';
        });
    }

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to student dashboard - user will be redirected to login if not authenticated
            window.location.href = 'student-dashboard.html';
        });
    }
}

// Simple HTML escaping
function escapeHtml(unsafe) {
    return unsafe
         .replaceAll('&', '&amp;')
         .replaceAll('<', '&lt;')
         .replaceAll('>', '&gt;')
         .replaceAll('"', '&quot;')
         .replaceAll("'", '&#039;');
}

function updateThemeIcon(button, theme) {
    button.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

// Navigation Management
function initializeNavigation() {
    // Handle sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');

            // Handle section switching
            const targetSection = this.getAttribute('href').substring(1);
            switchDashboardSection(targetSection);
        });
    });
}

function switchDashboardSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionId + 'Section') || document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

// Authentication Management
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        // Redirect to login if not authenticated and not on login page or site root.
        // NOTE: Netlify serves the site root as "/" (which does not include
        // "index.html" in the pathname). Treat "/" as the landing page so
        // users visiting the site root are not auto-redirected to login.
        if (!window.location.pathname.includes('login.html') && window.location.pathname !== '/' && !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Update user info in UI
    updateUserInfo(user);

    // NOTE: previously the app auto-redirected users from the login page when
    // a valid token + user were present in localStorage. That caused an
    // "auto-login" behavior. We intentionally do NOT redirect here so the
    // user can manually confirm / sign out if they wish. If you want to
    // pre-fill the login form with the stored user email, you can add that
    // behavior separately.
}

function updateUserInfo(user) {
    const userNameElements = document.querySelectorAll('#userName');
    userNameElements.forEach(element => {
        element.textContent = user.name || user.email;
    });
}

function redirectBasedOnRole(role) {
    switch (role) {
        case 'student':
            window.location.href = 'student-dashboard.html';
            break;
        case 'recruiter':
            window.location.href = 'recruiter-dashboard.html';
            break;
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        default:
            window.location.href = 'login.html';
    }
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const config = { ...defaultOptions, ...options };

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Parse body if possible
        const parsedBody = await response.json().catch(() => ({}));

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                logout();
                throw new Error('Authentication required');
            }
            throw new Error(parsedBody.message || `HTTP error! status: ${response.status}`);
        }

        // Normalize response shape so callers can rely on { success, data, message }
        return {
            success: true,
            data: parsedBody,
            message: parsedBody.message || null
        };
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Convenience helper for uploading FormData (files)
async function upload(endpoint, formData) {
    return await apiRequest(endpoint, {
        method: 'POST',
        body: formData
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Toast Notifications
function showToast(message, type = 'info', duration = 5000) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = getToastIcon(type);

    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return '✓';
        case 'error': return '✕';
        case 'warning': return '⚠';
        default: return 'ℹ';
    }
}

// Loading States
function showLoading(button) {
    if (!button) return;

    const originalText = button.innerHTML;
    button.setAttribute('data-original-text', originalText);
    button.disabled = true;

    const spinner = button.querySelector('.btn-spinner') || document.createElement('div');
    spinner.className = 'btn-spinner';
    spinner.innerHTML = '<div class="spinner"></div>';

    const textSpan = button.querySelector('.btn-text');
    if (textSpan) {
        textSpan.style.opacity = '0.7';
    }

    if (!button.contains(spinner)) {
        button.insertBefore(spinner, button.firstChild);
    }
    spinner.style.display = 'inline-block';
}

function hideLoading(button) {
    if (!button) return;

    button.disabled = false;
    const spinner = button.querySelector('.btn-spinner');
    const textSpan = button.querySelector('.btn-text');

    if (spinner) {
        spinner.style.display = 'none';
    }

    if (textSpan) {
        textSpan.style.opacity = '1';
    }
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Form Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showFormError(input, message) {
    const formGroup = input.closest('.form-group');
    let errorElement = formGroup.querySelector('.form-error');

    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        formGroup.appendChild(errorElement);
    }

    errorElement.textContent = message;
    input.classList.add('error');
}

function clearFormError(input) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.form-error');

    if (errorElement) {
        errorElement.remove();
    }

    input.classList.remove('error');
}

// Export functions for use in other modules
window.MainUtils = {
    apiRequest,
    upload,
    logout,
    showToast,
    showLoading,
    hideLoading,
    openModal,
    closeModal,
    formatDate,
    formatCurrency,
    truncateText,
    debounce,
    validateEmail,
    validatePassword,
    showFormError,
    clearFormError
    ,renderAnalysis, escapeHtml
};
