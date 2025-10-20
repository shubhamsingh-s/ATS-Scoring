// Job Details Page JavaScript module

document.addEventListener('DOMContentLoaded', function() {
    // Get job ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');

    if (!jobId) {
        showToast('Job ID not found', 'error');
        setTimeout(() => window.location.href = 'student-dashboard.html', 2000);
        return;
    }

    // Load job details
    loadJobDetails(jobId);

    // Initialize apply functionality
    initializeApplyFunctionality(jobId);
});

async function loadJobDetails(jobId) {
    try {
        const response = await MainUtils.apiRequest(`/jobs/${jobId}`);

        if (response.success) {
            displayJobDetails(response.data.job);
        } else {
            showToast('Failed to load job details', 'error');
        }
    } catch (error) {
        console.error('Failed to load job details:', error);
        showToast('Failed to load job details', 'error');
    }
}

function displayJobDetails(job) {
    // Update job header
    document.getElementById('jobTitle').textContent = job.title;
    document.getElementById('jobCompany').textContent = job.company;
    document.getElementById('jobLocation').textContent = job.location || 'Remote';
    document.getElementById('jobType').textContent = job.jobType || 'Full Time';

    // Update overview cards
    document.getElementById('jobSalary').textContent = job.salary ? `$${job.salary}` : 'Not specified';
    document.getElementById('jobPosted').textContent = formatDate(job.createdAt);
    document.getElementById('jobApplicants').textContent = `${job.applications?.length || 0} applicants`;
    document.getElementById('jobExperience').textContent = job.experience || 'Not specified';

    // Update description
    document.getElementById('jobDescription').innerHTML = formatJobDescription(job.description);

    // Update requirements
    document.getElementById('jobRequirements').innerHTML = formatJobRequirements(job.requirements);

    // Update company info
    document.getElementById('companyName').textContent = job.company;
    document.getElementById('companyDescription').textContent = job.companyDescription || 'No company description available.';

    // Load similar jobs
    loadSimilarJobs(job.id, job.requirements);

    // Check if user has already applied
    checkApplicationStatus(job.id);
}

function formatJobDescription(description) {
    if (!description) return '<p>No description available.</p>';

    // Convert line breaks to paragraphs
    const paragraphs = description.split('\n\n').filter(p => p.trim());
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
}

function formatJobRequirements(requirements) {
    if (!requirements) return '<p>No requirements specified.</p>';

    // Split by common delimiters and create list
    const reqList = requirements.split(/[,\n]/).map(r => r.trim()).filter(r => r);

    if (reqList.length === 0) {
        return '<p>No specific requirements listed.</p>';
    }

    return `
        <ul>
            ${reqList.map(req => `<li>${req}</li>`).join('')}
        </ul>
    `;
}

async function loadSimilarJobs(jobId, requirements) {
    const container = document.getElementById('similarJobs');

    try {
        // Extract keywords from requirements for similarity search
        const keywords = requirements ? requirements.split(/[,\s]+/).slice(0, 5) : [];

        const response = await MainUtils.apiRequest('/jobs/search', {
            method: 'POST',
            body: JSON.stringify({
                keywords: keywords,
                excludeId: jobId,
                limit: 3
            })
        });

        if (response.success && response.data.jobs.length > 0) {
            container.innerHTML = '';
            response.data.jobs.forEach(job => {
                const jobCard = createSimilarJobCard(job);
                container.appendChild(jobCard);
            });
        } else {
            container.innerHTML = '<p>No similar jobs found.</p>';
        }
    } catch (error) {
        console.error('Failed to load similar jobs:', error);
        container.innerHTML = '<p>Failed to load similar jobs.</p>';
    }
}

function createSimilarJobCard(job) {
    const card = document.createElement('div');
    card.className = 'similar-job-card';
    card.onclick = () => window.location.href = `job-details.html?id=${job.id}`;

    card.innerHTML = `
        <h4>${job.title}</h4>
        <p class="company">${job.company}</p>
        <p class="location">${job.location || 'Remote'}</p>
        <p class="salary">${job.salary ? `$${job.salary}` : 'Salary not specified'}</p>
        <div class="job-tags">
            ${job.requirements ? job.requirements.split(',').slice(0, 2).map(tag =>
                `<span class="tag">${tag.trim()}</span>`
            ).join('') : ''}
        </div>
    `;

    return card;
}

async function checkApplicationStatus(jobId) {
    const user = AuthUtils.getCurrentUser();
    if (!user || user.role !== 'student') return;

    try {
        const response = await MainUtils.apiRequest('/applications/my-applications');

        if (response.success) {
            const application = response.data.applications.find(app => app.jobId === parseInt(jobId));

            if (application) {
                // User has already applied
                updateApplyButtonState('applied', application);
            }
        }
    } catch (error) {
        console.error('Failed to check application status:', error);
    }
}

function updateApplyButtonState(state, application = null) {
    const applyBtn = document.getElementById('applyBtn');
    const statusSection = document.getElementById('applicationStatus');

    if (state === 'applied' && application) {
        applyBtn.style.display = 'none';

        statusSection.style.display = 'block';
        document.getElementById('statusBadge').textContent = application.status.charAt(0).toUpperCase() + application.status.slice(1);
        document.getElementById('statusMessage').textContent = getStatusMessage(application.status);
        document.getElementById('appliedDate').textContent = `Applied on: ${formatDate(application.appliedAt)}`;
    }
}

function getStatusMessage(status) {
    switch (status) {
        case 'applied': return 'Your application has been submitted and is under review.';
        case 'shortlisted': return 'Congratulations! You have been shortlisted for this position.';
        case 'rejected': return 'Unfortunately, your application was not successful this time.';
        default: return 'Your application status is being reviewed.';
    }
}

function initializeApplyFunctionality(jobId) {
    const applyBtn = document.getElementById('applyBtn');
    const quickApplyBtn = document.getElementById('quickApplyBtn');
    const applyForm = document.getElementById('applyForm');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => openModal('applyModal'));
    }

    if (quickApplyBtn) {
        quickApplyBtn.addEventListener('click', () => openModal('applyModal'));
    }

    if (applyForm) {
        applyForm.addEventListener('submit', (e) => handleJobApplication(e, jobId));
    }
}

async function handleJobApplication(e, jobId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const coverLetter = formData.get('coverLetter');
    const resumeFile = formData.get('resume')[0];

    // Basic validation
    if (!resumeFile) {
        showToast('Please select a resume file', 'error');
        return;
    }

    // Validate file
    if (!validateResumeFile(resumeFile)) {
        return;
    }

    const submitBtn = document.getElementById('submitApplicationBtn');
    showLoading(submitBtn);

    try {
        const applicationData = new FormData();
        applicationData.append('jobId', jobId);
        applicationData.append('resume', resumeFile);
        if (coverLetter) {
            applicationData.append('coverLetter', coverLetter);
        }

        const response = await MainUtils.apiRequest('/applications/apply', {
            method: 'POST',
            body: applicationData
        });

        if (response.success) {
            showToast('Application submitted successfully!', 'success');
            closeModal('applyModal');
            e.target.reset();

            // Update button state
            updateApplyButtonState('applied', response.data.application);
        } else {
            showToast(response.message || 'Failed to submit application', 'error');
        }
    } catch (error) {
        console.error('Application error:', error);
        showToast(error.message || 'Failed to submit application', 'error');
    } finally {
        hideLoading(submitBtn);
    }
}

function validateResumeFile(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        showToast('Please select a valid resume file (PDF, DOC, DOCX, or TXT)', 'error');
        return false;
    }

    if (file.size > maxSize) {
        showToast('Resume file must be less than 5MB', 'error');
        return false;
    }

    return true;
}

// Logout functionality
const logoutLink = document.getElementById('logoutLink');
if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        AuthUtils.logout();
    });
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

function closeModal(modalId) {
    MainUtils.closeModal(modalId);
}
