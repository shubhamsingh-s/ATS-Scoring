// Admin Dashboard JavaScript module

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = AuthUtils.getCurrentUser();
    if (user.role !== 'admin') {
        AuthUtils.redirectBasedOnRole(user.role);
        return;
    }

    // Initialize admin dashboard
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    // Load initial data
    loadPlatformStats();
    loadUsers();
    loadJobs();
    loadApplications();

    // Initialize job form
    initializeJobForm();

    // Initialize sidebar navigation
    initializeSidebarNavigation();

    // Initialize search and filters
    initializeFilters();
}

function initializeSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showSection(section);
        });
    });
}

function showSection(sectionId) {
    // Update active link
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

    // Hide all sections and show selected
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });

    const targetSection = document.getElementById(sectionId + 'Section') || document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

async function loadPlatformStats() {
    try {
        const [usersRes, jobsRes, appsRes] = await Promise.all([
            MainUtils.apiRequest('/admin/stats/users'),
            MainUtils.apiRequest('/admin/stats/jobs'),
            MainUtils.apiRequest('/admin/stats/applications')
        ]);

        if (usersRes.success) {
            document.getElementById('totalUsers').textContent = usersRes.data.total;
        }

        if (jobsRes.success) {
            document.getElementById('totalJobs').textContent = jobsRes.data.total;
        }

        if (appsRes.success) {
            document.getElementById('totalApplications').textContent = appsRes.data.total;
            document.getElementById('avgScore').textContent = appsRes.data.avgScore ?
                Math.round(appsRes.data.avgScore * 100) + '%' : 'N/A';
        }

        // Load role distribution for chart
        if (usersRes.success && usersRes.data.byRole) {
            renderRoleChart(usersRes.data.byRole);
        }

    } catch (error) {
        console.error('Failed to load platform stats:', error);
        showToast('Failed to load platform statistics', 'error');
    }
}

function renderRoleChart(roleData) {
    const canvas = document.getElementById('roleChart');
    if (!canvas) return;

    // Simple bar chart implementation
    const ctx = canvas.getContext('2d');
    const roles = Object.keys(roleData);
    const counts = Object.values(roleData);
    const maxCount = Math.max(...counts);

    const barWidth = 60;
    const barSpacing = 80;
    const startX = 50;
    const chartHeight = 150;
    const bottomMargin = 30;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bars
    roles.forEach((role, index) => {
        const x = startX + index * barSpacing;
        const height = (counts[index] / maxCount) * (chartHeight - bottomMargin);
        const y = chartHeight - height;

        // Bar
        ctx.fillStyle = getRoleColor(role);
        ctx.fillRect(x, y, barWidth, height);

        // Label
        ctx.fillStyle = '#2D3748';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(role.charAt(0).toUpperCase() + role.slice(1), x + barWidth/2, chartHeight + 15);

        // Value
        ctx.fillText(counts[index], x + barWidth/2, y - 5);
    });
}

function getRoleColor(role) {
    switch (role) {
        case 'student': return '#0055FF';
        case 'recruiter': return '#00C897';
        case 'admin': return '#FF6B35';
        default: return '#718096';
    }
}

function initializeFilters() {
    // User filters
    const userSearch = document.getElementById('userSearch');
    const userRoleFilter = document.getElementById('userRoleFilter');

    if (userSearch) {
        userSearch.addEventListener('input', debounce(() => loadUsers(), 500));
    }

    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', () => loadUsers());
    }

    // Job filters
    const jobSearch = document.getElementById('jobSearch');
    if (jobSearch) {
        jobSearch.addEventListener('input', debounce(() => loadJobs(), 500));
    }

    // Application filters
    const appStatusFilter = document.getElementById('appStatusFilter');
    if (appStatusFilter) {
        appStatusFilter.addEventListener('change', () => loadApplications());
    }

    // Log filters
    const logUserFilter = document.getElementById('logUserFilter');
    const logDateFilter = document.getElementById('logDateFilter');

    if (logDateFilter) {
        logDateFilter.addEventListener('change', () => loadActivityLogs());
    }

    // Load user options for log filter
    loadUserOptionsForFilter();
}

// Job form handling for admin (show spinner and disable submit during request)
function initializeJobForm() {
    const toggleBtn = document.getElementById('toggleJobForm');
    const formContainer = document.getElementById('jobFormContainer');
    const form = document.getElementById('jobForm');
    const cancelBtn = document.getElementById('cancelJobForm');

    if (toggleBtn && formContainer) {
        toggleBtn.addEventListener('click', function() {
            const isHidden = formContainer.classList.toggle('hidden');
            // Toggle button label
            this.textContent = isHidden ? '+ New Job' : 'Hide Form';
        });
    }

    if (cancelBtn && formContainer && toggleBtn) {
        cancelBtn.addEventListener('click', function() {
            formContainer.classList.add('hidden');
            toggleBtn.textContent = '+ New Job';
            if (form) form.reset();
        });
    }

    if (form) {
        form.addEventListener('submit', handleJobSubmissionAdmin);
    }
}

async function handleJobSubmissionAdmin(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const jobData = {
        title: formData.get('title'),
        company: formData.get('company'),
        location: formData.get('location'),
        jobType: formData.get('jobType'),
        salary: formData.get('salary'),
        experience: formData.get('experience'),
        description: formData.get('description'),
        requirements: formData.get('requirements')
    };

    // Inline validation: collect missing required fields and show inline summary
    const missing = [];
    if (!jobData.title) missing.push('Job title is required');
    if (!jobData.company) missing.push('Company is required');
    if (!jobData.description) missing.push('Job description is required');
    if (!jobData.requirements) missing.push('Required skills are required');

    if (missing.length) {
        showFormValidation(document.getElementById('jobForm'), missing);
        attachFormInputClearHandlers(document.getElementById('jobForm'));
        return;
    }

    const submitBtn = document.getElementById('submitJobBtn');
    try {
        // Show shared loading spinner and disable button
        if (MainUtils && typeof MainUtils.showLoading === 'function') MainUtils.showLoading(submitBtn);

        const response = await MainUtils.apiRequest('/admin/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });

        if (response.success) {
            showToast('Job posted successfully!', 'success');
            // Reset form and hide
            form.reset();
            document.getElementById('jobFormContainer').classList.add('hidden');
            document.getElementById('toggleJobForm').textContent = '+ New Job';

            // Reload jobs and stats
            loadJobs();
            loadPlatformStats();
        } else {
            showToast(response.message || 'Failed to post job', 'error');
        }
    } catch (error) {
        console.error('Admin job submission error:', error);
        // Show server error as toast, but preserve form validation summary for client-side checks
        showToast(error.message || 'Failed to post job', 'error');
    } finally {
        if (MainUtils && typeof MainUtils.hideLoading === 'function') MainUtils.hideLoading(submitBtn);
    }
}

// Inline validation summary helpers
function showFormValidation(form, messages) {
    if (!form) return;
    clearFormValidation(form);

    const container = document.createElement('div');
    container.className = 'form-validation-summary';
    container.id = `form-validation-${Date.now()}`;
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'assertive');
    container.innerHTML = `
        <div style="padding:.6rem; border-radius:.5rem; background: rgba(255,107,53,0.06); border:1px solid rgba(255,107,53,0.12); margin-bottom:.75rem; color:var(--text-primary);">
            <strong>Please fix the following:</strong>
            <ul style="margin:.5rem 0 0 1rem;">
                ${messages.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
            </ul>
        </div>
    `;

    form.insertBefore(container, form.firstChild);

    // focus the first invalid input if present
    const firstInvalid = form.querySelector('.form-error') || form.querySelector('input:invalid, textarea:invalid, select:invalid');
    if (firstInvalid) firstInvalid.focus();
}

function clearFormValidation(form) {
    if (!form) return;
    const existing = form.querySelector('.form-validation-summary');
    if (existing) existing.remove();

    // clear field-level errors
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

// Clear validation when user edits fields
function attachFormInputClearHandlers(form) {
    if (!form) return;
    const inputs = form.querySelectorAll('input,textarea,select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // clear field-level error for this input
            MainUtils && typeof MainUtils.clearFormError === 'function' ? MainUtils.clearFormError(input) : null;
            // remove summary if no field errors left
            const stillErrors = form.querySelectorAll('.form-error').length;
            if (!stillErrors) clearFormValidation(form);
        });
    });
}

async function loadUserOptionsForFilter() {
    try {
        const response = await MainUtils.apiRequest('/admin/users?page=1&limit=1000');

        if (response.success) {
            const select = document.getElementById('logUserFilter');
            if (select) {
                response.data.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name || user.email;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load users for filter:', error);
    }
}

async function loadUsers(page = 1, limit = 50) {
    const tableBody = document.getElementById('usersTableBody');
    const loading = document.getElementById('usersLoading');

    if (!tableBody) return;

    try {
        loading.style.display = 'block';
        tableBody.innerHTML = '';

        const search = document.getElementById('userSearch')?.value || '';
        const role = document.getElementById('userRoleFilter')?.value || '';

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (search) params.append('search', search);
        if (role) params.append('role', role);

        const response = await MainUtils.apiRequest(`/admin/users?${params}`);

        if (response.success) {
            response.data.users.forEach(user => {
                const row = createUserRow(user);
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        showToast('Failed to load users', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function createUserRow(user) {
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${user.name || 'N/A'}</td>
        <td>${user.email}</td>
        <td><span class="role-badge ${user.role}">${user.role}</span></td>
        <td>${formatDate(user.createdAt)}</td>
        <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
            <button class="btn-icon" onclick="viewUserDetails(${user.id})" title="View Details">
                👁️
            </button>
            <button class="btn-icon" onclick="toggleUserStatus(${user.id}, ${user.isActive})" title="${user.isActive ? 'Deactivate' : 'Activate'}">
                ${user.isActive ? '🚫' : '✅'}
            </button>
            <button class="btn-icon danger" onclick="deleteUser(${user.id})" title="Delete User">
                🗑️
            </button>
        </td>
    `;

    return row;
}

async function loadJobs(page = 1, limit = 50) {
    const tableBody = document.getElementById('jobsTableBody');
    const loading = document.getElementById('jobsLoading');

    if (!tableBody) return;

    try {
        loading.style.display = 'block';
        tableBody.innerHTML = '';

        const search = document.getElementById('jobSearch')?.value || '';

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (search) params.append('search', search);

        const response = await MainUtils.apiRequest(`/admin/jobs?${params}`);

        if (response.success) {
            response.data.jobs.forEach(job => {
                const row = createJobRow(job);
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load jobs:', error);
        showToast('Failed to load jobs', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function createJobRow(job) {
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${job.title}</td>
        <td>${job.company}</td>
        <td>${job.recruiter?.name || 'N/A'}</td>
        <td>${formatDate(job.createdAt)}</td>
        <td>${job.applications?.length || 0}</td>
        <td>
            <button class="btn-icon" onclick="viewJobDetails(${job.id})" title="View Details">
                👁️
            </button>
            <button class="btn-icon danger" onclick="deleteJob(${job.id})" title="Delete Job">
                🗑️
            </button>
        </td>
    `;

    return row;
}

async function loadApplications(page = 1, limit = 50) {
    const tableBody = document.getElementById('applicationsTableBody');
    const loading = document.getElementById('applicationsLoading');

    if (!tableBody) return;

    try {
        loading.style.display = 'block';
        tableBody.innerHTML = '';

        const status = document.getElementById('appStatusFilter')?.value || '';

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (status) params.append('status', status);

        const response = await MainUtils.apiRequest(`/admin/applications?${params}`);

        if (response.success) {
            response.data.applications.forEach(app => {
                const row = createApplicationRow(app);
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Failed to load applications:', error);
        showToast('Failed to load applications', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function createApplicationRow(app) {
    const row = document.createElement('tr');

    const atsScore = app.atsScore ? Math.round(app.atsScore * 100) + '%' : 'N/A';

    row.innerHTML = `
        <td>${app.student?.name || 'N/A'}</td>
        <td>${app.job?.title || 'N/A'}</td>
        <td>${atsScore}</td>
        <td><span class="status-badge ${app.status}">${app.status}</span></td>
        <td>${formatDate(app.appliedAt)}</td>
        <td>
            <button class="btn-icon" onclick="viewApplicationDetails(${app.id})" title="View Details">
                👁️
            </button>
        </td>
    `;

    return row;
}

async function loadActivityLogs(page = 1, limit = 50) {
    const container = document.getElementById('logsContainer');
    const loading = document.getElementById('logsLoading');

    if (!container) return;

    try {
        loading.style.display = 'block';
        container.innerHTML = '';

        const userId = document.getElementById('logUserFilter')?.value || '';
        const date = document.getElementById('logDateFilter')?.value || '';

        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (userId) params.append('userId', userId);
        if (date) params.append('date', date);

        const response = await MainUtils.apiRequest(`/admin/logs?${params}`);

        if (response.success) {
            if (response.data.logs.length === 0) {
                container.innerHTML = '<div class="no-data">No activity logs found</div>';
            } else {
                response.data.logs.forEach(log => {
                    const logItem = createLogItem(log);
                    container.appendChild(logItem);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load activity logs:', error);
        showToast('Failed to load activity logs', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function createLogItem(log) {
    const item = document.createElement('div');
    item.className = 'log-item';

    item.innerHTML = `
        <div class="log-header">
            <span class="log-action">${log.action}</span>
            <span class="log-timestamp">${formatDate(log.timestamp)}</span>
        </div>
        <div class="log-details">
            <span class="log-user">${log.user?.name || log.user?.email || 'Unknown User'}</span>
            <span class="log-description">${log.description}</span>
        </div>
    `;

    return item;
}

// Action handlers
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }

    try {
        const response = await MainUtils.apiRequest(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive: !currentStatus })
        });

        if (response.success) {
            showToast(`User ${action}d successfully`, 'success');
            loadUsers();
            loadPlatformStats();
        } else {
            showToast(response.message || `Failed to ${action} user`, 'error');
        }
    } catch (error) {
        console.error('Status toggle error:', error);
        showToast(`Failed to ${action} user`, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await MainUtils.apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showToast('User deleted successfully', 'success');
            loadUsers();
            loadPlatformStats();
        } else {
            showToast(response.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showToast('Failed to delete user', 'error');
    }
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await MainUtils.apiRequest(`/admin/jobs/${jobId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showToast('Job deleted successfully', 'success');
            loadJobs();
            loadPlatformStats();
        } else {
            showToast(response.message || 'Failed to delete job', 'error');
        }
    } catch (error) {
        console.error('Delete job error:', error);
        showToast('Failed to delete job', 'error');
    }
}

function viewUserDetails(userId) {
    showToast('User details view coming soon!', 'info');
}

function viewJobDetails(jobId) {
    showToast('Job details view coming soon!', 'info');
}

function viewApplicationDetails(appId) {
    showToast('Application details view coming soon!', 'info');
}

// Utility functions
function formatDate(dateString) {
    return MainUtils.formatDate(dateString);
}

function showToast(message, type) {
    MainUtils.showToast(message, type);
}

function debounce(func, wait) {
    return MainUtils.debounce(func, wait);
}
