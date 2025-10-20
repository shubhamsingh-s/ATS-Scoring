// Recruiter Dashboard JavaScript module

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = AuthUtils.getCurrentUser();
    if (user.role !== 'recruiter') {
        AuthUtils.redirectBasedOnRole(user.role);
        return;
    }

    // Initialize recruiter dashboard
    initializeRecruiterDashboard();
});

function initializeRecruiterDashboard() {
    // Load initial data
    loadDashboardStats();
    loadJobs();

    // Initialize job form
    initializeJobForm();

    // Initialize sidebar navigation
    initializeSidebarNavigation();
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

async function loadDashboardStats() {
    try {
        // Load jobs to calculate stats
        const jobsResponse = await MainUtils.apiRequest('/jobs/recruiter/my-jobs?page=1&limit=1000');

        if (jobsResponse.success) {
            const jobs = jobsResponse.data.jobs;
            let totalApplications = 0;
            let shortlistedCount = 0;

            // Calculate stats from jobs
            jobs.forEach(job => {
                if (job.applications) {
                    totalApplications += job.applications.length;
                    shortlistedCount += job.applications.filter(app => app.status === 'shortlisted').length;
                }
            });

            // Update UI
            document.getElementById('totalJobs').textContent = jobs.length;
            document.getElementById('totalApplications').textContent = totalApplications;
            document.getElementById('shortlistedCount').textContent = shortlistedCount;
            document.getElementById('avgScore').textContent = '85%'; // Placeholder
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        showToast('Failed to load dashboard statistics', 'error');
    }
}

function initializeJobForm() {
    const toggleBtn = document.getElementById('toggleJobForm');
    const formContainer = document.getElementById('jobFormContainer');
    const form = document.getElementById('jobForm');
    const cancelBtn = document.getElementById('cancelJobForm');


    if (toggleBtn && formContainer) {
        toggleBtn.addEventListener('click', function() {
            const isHidden = formContainer.classList.toggle('hidden');
            this.textContent = isHidden ? '+ New Job' : 'Hide Form';
        });
    }

    if (cancelBtn && formContainer && toggleBtn) {
        cancelBtn.addEventListener('click', function() {
            formContainer.classList.add('hidden');
            toggleBtn.textContent = '+ New Job';
            form.reset();
        });
    }

    if (form) {
        form.addEventListener('submit', handleJobSubmission);
    }
}

async function handleJobSubmission(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
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

    // Basic validation
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
    showLoading(submitBtn);

    try {
        const response = await MainUtils.apiRequest('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });

        if (response.success) {
            showToast('Job posted successfully!', 'success');

            // Reset form and hide
            e.target.reset();
            document.getElementById('jobFormContainer').style.display = 'none';
            document.getElementById('toggleJobForm').textContent = '+ New Job';

            // Reload jobs
            loadJobs();
            loadDashboardStats();
        } else {
            showToast(response.message || 'Failed to post job', 'error');
        }
    } catch (error) {
        console.error('Job submission error:', error);
        showToast(error.message || 'Failed to post job', 'error');
    } finally {
        hideLoading(submitBtn);
    }
}

// Inline validation summary helpers (recruiter)
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
                ${messages.map(m => `<li>${m.replace(/</g,'&lt;')}</li>`).join('')}
            </ul>
        </div>
    `;

    form.insertBefore(container, form.firstChild);

    const firstInvalid = form.querySelector('.form-error') || form.querySelector('input:invalid, textarea:invalid, select:invalid');
    if (firstInvalid) firstInvalid.focus();
}

function clearFormValidation(form) {
    if (!form) return;
    const existing = form.querySelector('.form-validation-summary');
    if (existing) existing.remove();
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

function attachFormInputClearHandlers(form) {
    if (!form) return;
    const inputs = form.querySelectorAll('input,textarea,select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (MainUtils && typeof MainUtils.clearFormError === 'function') MainUtils.clearFormError(input);
            const stillErrors = form.querySelectorAll('.form-error').length;
            if (!stillErrors) clearFormValidation(form);
        });
    });
}

async function loadJobs() {
    const tableBody = document.getElementById('jobsTableBody');
    const loading = document.getElementById('jobsLoading');
    const noJobs = document.getElementById('noJobs');

    if (!tableBody) return;

    try {
        loading.style.display = 'block';
        tableBody.innerHTML = '';

        const response = await MainUtils.apiRequest('/jobs/recruiter/my-jobs?page=1&limit=50');

        if (response.success && response.data.jobs.length > 0) {
            response.data.jobs.forEach(job => {
                const row = createJobRow(job);
                tableBody.appendChild(row);
            });
            noJobs.style.display = 'none';
        } else {
            noJobs.style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load jobs:', error);
        showToast('Failed to load jobs', 'error');
        noJobs.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function createJobRow(job) {
    const row = document.createElement('tr');

    const applications = job.applications || [];
    const shortlisted = applications.filter(app => app.status === 'shortlisted').length;
    const totalApps = applications.length;

    row.innerHTML = `
        <td>${job.title}</td>
        <td>${job.company}</td>
        <td>${totalApps}</td>
        <td>${formatDate(job.createdAt)}</td>
        <td><span class="status-badge active">Active</span></td>
        <td>
            <button class="btn-icon" onclick="viewApplicants(${job.id})" title="View Applicants">
                👥
            </button>
            <button class="btn-icon" onclick="editJob(${job.id})" title="Edit Job">
                ✏️
            </button>
            <button class="btn-icon danger" onclick="deleteJob(${job.id})" title="Delete Job">
                🗑️
            </button>
        </td>
    `;

    return row;
}

async function viewApplicants(jobId) {
    try {
        const response = await MainUtils.apiRequest(`/applications/job/${jobId}/applicants`);

        if (response.success) {
            displayApplicantsModal(jobId, response.data.applicants);
        } else {
            showToast('Failed to load applicants', 'error');
        }
    } catch (error) {
        console.error('Failed to load applicants:', error);
        showToast('Failed to load applicants', 'error');
    }
}

function displayApplicantsModal(jobId, applicants) {
    const modal = document.getElementById('applicantsModal');
    const title = document.getElementById('applicantsModalTitle');
    const list = document.getElementById('applicantsList');

    title.textContent = `Job Applicants (${applicants.length})`;
    list.innerHTML = '';

    if (applicants.length === 0) {
        list.innerHTML = '<div class="no-data">No applicants yet</div>';
    } else {
        applicants.forEach(applicant => {
            const applicantCard = createApplicantCard(applicant);
            list.appendChild(applicantCard);
        });
    }

    openModal('applicantsModal');
}

function createApplicantCard(applicant) {
    const card = document.createElement('div');
    card.className = 'applicant-card';

    const statusClass = applicant.status === 'shortlisted' ? 'success' :
                       applicant.status === 'rejected' ? 'error' : 'warning';

    card.innerHTML = `
        <div class="applicant-header">
            <div class="applicant-info">
                <h4>${applicant.student?.name || 'Unknown Student'}</h4>
                <p>${applicant.student?.email || 'No email'}</p>
            </div>
            <div class="applicant-status">
                <span class="status-badge ${statusClass}">${applicant.status}</span>
            </div>
        </div>
        <div class="applicant-details">
            <div class="detail-item">
                <span class="label">Applied:</span>
                <span class="value">${formatDate(applicant.appliedAt)}</span>
            </div>
            <div class="detail-item">
                <span class="label">ATS Score:</span>
                <span class="value">${applicant.atsScore ? Math.round(applicant.atsScore * 100) + '%' : 'N/A'}</span>
            </div>
        </div>
        <div class="applicant-actions">
            <button class="btn-secondary btn-small" onclick="viewApplicantDetails(${applicant.id})">
                View Details
            </button>
            ${applicant.status !== 'shortlisted' ?
                `<button class="btn-success btn-small" onclick="updateApplicationStatus(${applicant.id}, 'shortlisted')">
                    Shortlist
                </button>` : ''}
            ${applicant.status !== 'rejected' ?
                `<button class="btn-danger btn-small" onclick="updateApplicationStatus(${applicant.id}, 'rejected')">
                    Reject
                </button>` : ''}
        </div>
    `;

    return card;
}

async function viewApplicantDetails(applicationId) {
    try {
        const response = await MainUtils.apiRequest(`/ats/analysis/${applicationId}`);

        if (response.success) {
            displayApplicantModal(response.data.analysis);
        } else {
            showToast('Failed to load applicant details', 'error');
        }
    } catch (error) {
        console.error('Failed to load applicant details:', error);
        showToast('Failed to load applicant details', 'error');
    }
}

function displayApplicantModal(analysis) {
    const modal = document.getElementById('applicantModal');
    const title = document.getElementById('applicantModalTitle');
    const content = document.getElementById('applicantModalContent');

    title.textContent = `Applicant Analysis`;
    content.innerHTML = `
        <div class="analysis-details">
            <div class="score-section">
                <h3>ATS Score: ${Math.round(analysis.score * 100)}%</h3>
                <div class="score-breakdown">
                    <div class="score-item">
                        <span>Keyword Match:</span>
                        <span>${analysis.keywordScore || 'N/A'}%</span>
                    </div>
                    <div class="score-item">
                        <span>Format Score:</span>
                        <span>${analysis.formatScore || 'N/A'}%</span>
                    </div>
                </div>
            </div>
            <div class="keywords-section">
                <h4>Matched Keywords</h4>
                <div class="keywords-list">
                    ${analysis.matchedKeywords?.map(k => `<span class="keyword-tag matched">${k}</span>`).join('') || 'None'}
                </div>
                <h4>Missing Keywords</h4>
                <div class="keywords-list">
                    ${analysis.missingKeywords?.map(k => `<span class="keyword-tag missing">${k}</span>`).join('') || 'None'}
                </div>
            </div>
            <div class="recommendations-section">
                <h4>Recommendations</h4>
                <ul>
                    ${analysis.recommendations?.map(r => `<li>${r}</li>`).join('') || '<li>No recommendations available</li>'}
                </ul>
            </div>
        </div>
    `;

    openModal('applicantModal');
}

async function updateApplicationStatus(applicationId, status) {
    try {
        const response = await MainUtils.apiRequest(`/applications/${applicationId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        if (response.success) {
            showToast(`Application ${status} successfully`, 'success');
            // Refresh applicants list
            const modal = document.getElementById('applicantsModal');
            if (modal.style.display !== 'none') {
                // Re-load current job applicants
                const jobId = modal.dataset.jobId;
                if (jobId) {
                    viewApplicants(jobId);
                }
            }
            // Refresh dashboard stats
            loadDashboardStats();
        } else {
            showToast(response.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Status update error:', error);
        showToast('Failed to update application status', 'error');
    }
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await MainUtils.apiRequest(`/jobs/${jobId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showToast('Job deleted successfully', 'success');
            loadJobs();
            loadDashboardStats();
        } else {
            showToast(response.message || 'Failed to delete job', 'error');
        }
    } catch (error) {
        console.error('Delete job error:', error);
        showToast('Failed to delete job', 'error');
    }
}

function editJob(jobId) {
    // For now, just show a message. Full edit functionality can be added later
    showToast('Edit functionality coming soon!', 'info');
}

// Utility functions
function formatDate(dateString) {
    return MainUtils.formatDate(dateString);
}

function showToast(message, type) {
    MainUtils.showToast(message, type);
}

function showLoading(button) {
    MainUtils.showLoading(button);
}

function hideLoading(button) {
    MainUtils.hideLoading(button);
}

function openModal(modalId) {
    MainUtils.openModal(modalId);
}
