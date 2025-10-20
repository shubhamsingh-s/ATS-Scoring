// Authentication JavaScript module

document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth-related elements
    initializeAuth();
});

function initializeAuth() {
    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register modal handling
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('registerModal');
        });
    }

    // Register form handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Logout handling
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Modal close handling
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(close => {
        close.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    // Basic validation
    if (!loginData.email || !loginData.password || !loginData.role) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (!MainUtils.validateEmail(loginData.email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    showLoading(loginBtn);

    try {
        const response = await MainUtils.apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });

        if (response.success) {
            // Store auth data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            showToast('Login successful!', 'success');

            // Redirect based on role
            setTimeout(() => {
                redirectBasedOnRole(response.data.user.role);
            }, 1000);
        } else {
            showToast(response.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        hideLoading(loginBtn);
    }
}

// Register handler
async function handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    // Basic validation
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.role) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (!MainUtils.validateEmail(registerData.email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    if (!MainUtils.validatePassword(registerData.password)) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }

    const registerBtn = document.getElementById('registerBtn');
    showLoading(registerBtn);

    try {
        const response = await MainUtils.apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });

        if (response.success) {
            showToast('Registration successful! Please login.', 'success');
            closeModal('registerModal');
            e.target.reset();
        } else {
            showToast(response.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        hideLoading(registerBtn);
    }
}

// Logout handler
function handleLogout(e) {
    e.preventDefault();

    // Clear stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    showToast('Logged out successfully', 'success');

    // Redirect to login
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Profile management
async function loadProfile() {
    try {
        const response = await MainUtils.apiRequest('/auth/profile');

        if (response.success) {
            const user = response.data.user;
            updateProfileUI(user);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

function updateProfileUI(user) {
    // Update profile form fields
    const nameInput = document.getElementById('profileName');
    if (nameInput) {
        nameInput.value = user.name || '';
    }

    const emailDisplay = document.getElementById('profileEmail');
    if (emailDisplay) {
        emailDisplay.textContent = user.email;
    }

    const roleDisplay = document.getElementById('profileRole');
    if (roleDisplay) {
        roleDisplay.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
}

async function updateProfile(name) {
    try {
        const response = await MainUtils.apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ name })
        });

        if (response.success) {
            // Update stored user data
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.name = name;
            localStorage.setItem('user', JSON.stringify(user));

            showToast('Profile updated successfully', 'success');
            return true;
        } else {
            showToast(response.message || 'Failed to update profile', 'error');
            return false;
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Failed to update profile', 'error');
        return false;
    }
}

// Utility functions
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

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
}

// Get current user
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Export functions for use in other modules
window.AuthUtils = {
    isAuthenticated,
    getCurrentUser,
    getAuthToken,
    loadProfile,
    updateProfile,
    redirectBasedOnRole
};
