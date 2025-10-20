// Student Dashboard JavaScript module

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = AuthUtils.getCurrentUser();
    if (user.role !== 'student') {
        AuthUtils.redirectBasedOnRole(user.role);
        return;
    }

    // Initialize student dashboard
    initializeStudentDashboard();
});

function initializeStudentDashboard() {
    // Load initial data
    loadJobRecommendations();
    loadAnalysisHistory();

    // Initialize file upload
    initializeFileUpload();

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

function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const resumeFile = document.getElementById('resumeFile');
    const uploadForm = document.querySelector('.upload-form');

    if (uploadArea && resumeFile) {
        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        uploadArea.addEventListener('drop', handleDrop, false);
        uploadArea.addEventListener('click', () => resumeFile.click());
        resumeFile.addEventListener('change', handleFileSelect);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight() {
            uploadArea.classList.add('dragover');
        }

        function unhighlight() {
            uploadArea.classList.remove('dragover');
        }

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        function handleFileSelect(e) {
            const files = e.target.files;
            handleFiles(files);
        }

        function handleFiles(files) {
            if (files.length > 0) {
                const file = files[0];
                if (validateFile(file)) {
                    showUploadForm(file);
                }
            }
        }
    }

    // Upload form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleResumeUpload);
    }

    // Cancel upload
    const cancelBtn = document.getElementById('cancelUpload');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelUpload);
    }
}

function validateFile(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        showToast('Please select a valid file type (PDF, DOC, DOCX, or TXT)', 'error');
        return false;
    }

    if (file.size > maxSize) {
        showToast('File size must be less than 5MB', 'error');
        return false;
    }

    return true;
}

function showUploadForm(file) {
    const uploadArea = document.getElementById('uploadArea');
    const uploadForm = document.querySelector('.upload-form');

    uploadArea.style.display = 'none';
    uploadForm.style.display = 'block';

    // Update file name display
    const fileName = file.name;
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    fileInfo.innerHTML = `<strong>Selected file:</strong> ${fileName}`;
    uploadForm.insertBefore(fileInfo, uploadForm.firstChild);
}

function cancelUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadForm = document.querySelector('.upload-form');
    const fileInfo = uploadForm.querySelector('.file-info');

    if (fileInfo) fileInfo.remove();
    document.getElementById('resumeFile').value = '';
    document.getElementById('jobDescription').value = '';

    uploadArea.style.display = 'block';
    uploadForm.style.display = 'none';
}

async function handleResumeUpload(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const file = document.getElementById('resumeFile').files[0];
    const jobDescription = formData.get('jobDescription');

    if (!file) {
        showToast('Please select a resume file', 'error');
        return;
    }

    const uploadBtn = document.getElementById('uploadBtn');
    showLoading(uploadBtn);

    try {
        const uploadData = new FormData();
        uploadData.append('resume', file);
        if (jobDescription) {
            uploadData.append('jobDescription', jobDescription);
        }

        const response = await MainUtils.upload('/ats/score', uploadData);

        if (response.success) {
            // Backend returns analysis object inside data.analysis (we wrap the body in data)
            const analysis = response.data.analysis || response.data;
            showToast('Resume analyzed successfully!', 'success');
            displayAnalysisResults(analysis.analysis || analysis);
            // Also render a homepage-style summary if available
            if (window.MainUtils && typeof window.MainUtils.renderAnalysis === 'function') {
                window.MainUtils.renderAnalysis(analysis.analysis || analysis);
            }

            // Reload recommendations
            loadJobRecommendations();
        } else {
            showToast(response.message || 'Analysis failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast(error.message || 'Failed to analyze resume', 'error');
    } finally {
        hideLoading(uploadBtn);
    }
}

function displayAnalysisResults(analysis) {
    const resultsSection = document.getElementById('resultsSection');
    const scoreValue = document.getElementById('scoreValue');
    const scoreLabel = document.getElementById('scoreLabel');
    const scoreCircle = document.getElementById('scoreCircle');

    // Show results section
    resultsSection.style.display = 'block';

    // Update score
    const score = Math.round(analysis.score * 100);
    scoreValue.textContent = score;

    // Animate progress circle
    const progress = scoreCircle.querySelector('#scoreProgress');
    const circumference = 314; // 2 * π * 50
    const offset = circumference - (score / 100) * circumference;
    progress.style.strokeDashoffset = offset;

    // Update score label
    let label = 'Poor Match';
    let labelColor = '#FF4757';
    if (score >= 80) {
        label = 'Excellent Match';
        labelColor = '#4CAF50';
    } else if (score >= 60) {
        label = 'Good Match';
        labelColor = '#FFA726';
    } else if (score >= 40) {
        label = 'Fair Match';
        labelColor = '#FF9800';
    }

    scoreLabel.textContent = label;
    scoreLabel.style.color = labelColor;

    // Display keywords
    displayKeywords(analysis.matchedKeywords, analysis.missingKeywords);

    // Display recommendations
    displayRecommendations(analysis.recommendations);
}

function displayKeywords(matched, missing) {
    const matchedContainer = document.getElementById('matchedKeywords');
    const missingContainer = document.getElementById('missingKeywords');

    matchedContainer.innerHTML = '';
    missingContainer.innerHTML = '';

    if (matched && matched.length > 0) {
        matched.forEach(keyword => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag matched';
            tag.textContent = keyword;
            matchedContainer.appendChild(tag);
        });
    } else {
        matchedContainer.innerHTML = '<span class="no-keywords">No matched keywords found</span>';
    }

    if (missing && missing.length > 0) {
        missing.forEach(keyword => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag missing';
            tag.textContent = keyword;
            missingContainer.appendChild(tag);
        });
    } else {
        missingContainer.innerHTML = '<span class="no-keywords">No missing keywords</span>';
    }
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '';

    if (recommendations && recommendations.length > 0) {
        recommendations.forEach(rec => {
            const item = document.createElement('li');
            item.innerHTML = `<span class="rec-icon">💡</span> ${rec}`;
            container.appendChild(item);
        });
    } else {
        container.innerHTML = '<li>No specific recommendations available</li>';
    }
}

async function loadJobRecommendations() {
    const container = document.getElementById('recommendedJobs');
    const loading = document.getElementById('jobsLoading');
    const noJobs = document.getElementById('noJobs');

    try {
        loading.style.display = 'block';
        container.innerHTML = '';

        const response = await MainUtils.apiRequest('/ats/recommendations');

        if (response.success && response.data.jobs.length > 0) {
            response.data.jobs.forEach(job => {
                const jobCard = createJobCard(job);
                container.appendChild(jobCard);
            });
        } else {
            noJobs.style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load recommendations:', error);
        showToast('Failed to load job recommendations', 'error');
        noJobs.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.onclick = () => window.location.href = `job-details.html?id=${job.id}`;

    card.innerHTML = `
        <div class="job-card-header">
            <h3 class="job-title">${job.title}</h3>
            <div class="job-company">${job.company}</div>
        </div>
        <div class="job-meta">
            <span>${job.location || 'Remote'}</span>
            <span>${job.jobType || 'Full Time'}</span>
            <span>${job.salary ? '$' + job.salary : 'Salary not specified'}</span>
        </div>
        <div class="job-description">
            ${job.description ? job.description.substring(0, 150) + '...' : 'No description available'}
        </div>
        <div class="job-skills">
            ${job.requirements ? job.requirements.split(',').slice(0, 3).map(skill =>
                `<span class="skill-tag">${skill.trim()}</span>`
            ).join('') : ''}
        </div>
        <div class="job-footer">
            <span class="job-date">Posted ${formatDate(job.createdAt)}</span>
            <button class="btn-secondary btn-small" onclick="applyForJob(${job.id}, event)">Apply Now</button>
        </div>
    `;

    return card;
}

async function applyForJob(jobId, event) {
    event.stopPropagation();

    try {
        const response = await MainUtils.apiRequest('/applications/apply', {
            method: 'POST',
            body: JSON.stringify({ jobId })
        });

        if (response.success) {
            showToast('Application submitted successfully!', 'success');
        } else {
            showToast(response.message || 'Failed to apply', 'error');
        }
    } catch (error) {
        console.error('Application error:', error);
        showToast(error.message || 'Failed to submit application', 'error');
    }
}

async function loadAnalysisHistory() {
    try {
        const response = await MainUtils.apiRequest('/ats/history');

        if (response.success && response.data.analyses.length > 0) {
            // Store history for later use
            window.analysisHistory = response.data.analyses;
        }
    } catch (error) {
        console.error('Failed to load analysis history:', error);
    }
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
