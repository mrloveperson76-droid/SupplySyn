// js/authUI.js

import { registerUser, loginUser, setCurrentUser, isAuthenticated, getCurrentUser } from './services/authService.js';
import { loadStateFromLocalStorage } from './services/storageService.js';
import { renderAll } from './ui.js';

// Show authentication screen (login or register)
export function showAuthScreen() {
    const container = document.querySelector('.container');
    
    // Hide main app content
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.style.display = 'none';
    
    // Hide header
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    // Create auth container
    const authContainer = document.createElement('div');
    authContainer.id = 'auth-container';
    authContainer.className = 'auth-container';
    authContainer.innerHTML = `
        <div class="auth-form-container">
            <div class="auth-header">
                <h1><i class="fas fa-boxes-stacked"></i> SupplySync</h1>
                <p>Inventory Management System</p>
            </div>
            <div class="auth-tabs">
                <button id="login-tab" class="auth-tab active">Login</button>
                <button id="register-tab" class="auth-tab">Register</button>
            </div>
            <div id="auth-form-content">
                <!-- Login form will be loaded here by default -->
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(authContainer);
    
    // Load login form by default
    showLoginForm();
    
    // Add event listeners for tabs
    document.getElementById('login-tab').addEventListener('click', () => {
        showLoginForm();
    });
    
    document.getElementById('register-tab').addEventListener('click', () => {
        showRegisterForm();
    });
}

// Show login form
function showLoginForm() {
    // Update active tab
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    
    // Update form content
    const formContent = document.getElementById('auth-form-content');
    formContent.innerHTML = `
        <form id="login-form" class="auth-form">
            <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" required>
            </div>
            <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" required>
            </div>
            <div class="form-group form-checkbox">
                <input type="checkbox" id="remember-me">
                <label for="remember-me">Remember me</label>
            </div>
            <button type="submit" class="auth-btn cta-button">Login</button>
            <div class="auth-links">
                <a href="#" id="forgot-password-link">Forgot Password?</a>
            </div>
            <div id="login-error" class="auth-error"></div>
        </form>
    `;
    
    // Add event listener for login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Show register form
function showRegisterForm() {
    // Update active tab
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    
    // Update form content
    const formContent = document.getElementById('auth-form-content');
    formContent.innerHTML = `
        <form id="register-form" class="auth-form">
            <div class="form-group">
                <label for="register-fullname">Full Name</label>
                <input type="text" id="register-fullname" required>
            </div>
            <div class="form-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" required>
            </div>
            <div class="form-group">
                <label for="register-password">Password</label>
                <input type="password" id="register-password" required>
            </div>
            <div class="form-group">
                <label for="register-confirm-password">Confirm Password</label>
                <input type="password" id="register-confirm-password" required>
            </div>
            <button type="submit" class="auth-btn cta-button">Register</button>
            <div id="register-error" class="auth-error"></div>
        </form>
    `;
    
    // Add event listener for register form
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    try {
        errorElement.textContent = '';
        const user = loginUser(email, password);
        setCurrentUser(user);
        
        // Hide auth screen and show main app
        hideAuthScreen();
        showMainApp();
    } catch (error) {
        errorElement.textContent = error.message;
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorElement = document.getElementById('register-error');
    
    try {
        errorElement.textContent = '';
        
        // Check if passwords match
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        // Register user
        const user = registerUser(fullName, email, password);
        
        // Show success message and switch to login tab
        alert('Registration successful! Please login with your credentials.');
        showLoginForm();
    } catch (error) {
        errorElement.textContent = error.message;
    }
}

// Hide authentication screen
export function hideAuthScreen() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.remove();
    }
    
    // Show main app content
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.style.display = 'grid';
    
    // Show header
    const header = document.querySelector('header');
    if (header) header.style.display = 'flex';
}

// Show main application
export function showMainApp() {
    // Load user data
    loadStateFromLocalStorage();
    
    // Render all components
    renderAll();
    
    // Update user info in header
    updateUserInfo();
}

// Update user info in header
function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        // Create user info element if it doesn't exist
        let userInfo = document.getElementById('user-info');
        if (!userInfo) {
            userInfo = document.createElement('div');
            userInfo.id = 'user-info';
            userInfo.className = 'user-info';
            
            // Insert at the end of the header (far right)
            const header = document.querySelector('header');
            header.appendChild(userInfo);
        }
        
        userInfo.innerHTML = `
            <div class="user-info-content">
                <span class="user-name">${user.fullName} <i class="fas fa-cog settings-icon" id="settings-icon"></i></span>
            </div>
            <div class="user-dropdown" id="user-dropdown">
                <button id="edit-profile-btn" class="dropdown-item edit-profile">Edit Profile</button>
                <button id="change-password-btn" class="dropdown-item change-password">Change Password</button>
                <button id="logout-btn" class="dropdown-item logout">Logout</button>
            </div>
        `;
        
        // Add settings icon event listener
        // Settings icon will now toggle the dropdown menu like the username click
        
        // Add dropdown toggle functionality
        const userContent = document.querySelector('.user-info-content');
        const userDropdown = document.getElementById('user-dropdown');
        const settingsIcon = document.getElementById('settings-icon');
        
        // Toggle dropdown when clicking username or settings icon
        const toggleDropdown = (e) => {
            // Prevent event from bubbling up to document listener
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        };
        
        userContent.addEventListener('click', toggleDropdown);
        settingsIcon.addEventListener('click', toggleDropdown);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userContent.contains(e.target) && !settingsIcon.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
        
        // Add event listeners for dropdown items
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const changePasswordBtn = document.getElementById('change-password-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                userDropdown.classList.remove('show');
                showEditProfileModal();
            });
        }
        
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                userDropdown.classList.remove('show');
                showChangePasswordModal();
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                userDropdown.classList.remove('show');
                // Import logoutUser here to avoid circular dependency
                import('./services/authService.js').then(authService => {
                    authService.logoutUser();
                    hideMainApp();
                    showAuthScreen();
                });
            });
        }
    }
}

// Hide main application
export function hideMainApp() {
    // Hide main app content
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.style.display = 'none';
    
    // Hide header
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
    
    // Remove user info if it exists
    const userInfo = document.getElementById('user-info');
    if (userInfo) userInfo.remove();
}

// Show edit profile modal
function showEditProfileModal() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-content user-modal-content">
            <h3>Edit Profile</h3>
            <form id="edit-profile-form">
                <div class="modal-form-field">
                    <label for="modal-full-name">Full Name</label>
                    <input type="text" id="modal-full-name" value="${user.fullName || ''}" placeholder="Enter your full name">
                </div>
                <div class="modal-form-field">
                    <label for="modal-email">Email</label>
                    <input type="email" id="modal-email" value="${user.email || ''}" placeholder="Enter your email">
                </div>
                <div class="modal-form-field">
                    <label for="modal-phone">Phone</label>
                    <input type="tel" id="modal-phone" value="${user.phone || ''}" placeholder="Enter your phone number">
                </div>
                <div class="modal-form-field">
                    <label for="modal-address">Address</label>
                    <textarea id="modal-address" rows="3" placeholder="Enter your address">${user.address || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" id="cancel-profile-modal" class="secondary-button">Cancel</button>
                    <button type="submit" id="save-profile-modal" class="button">Save Profile</button>
                </div>
            </form>
        </div>
    `;
    
    // Show modal using existing modal system
    import('./modal.js').then(modal => {
        // Create a temporary modal container
        const tempModal = document.createElement('div');
        tempModal.id = 'edit-profile-modal';
        tempModal.className = 'modal-backdrop';
        tempModal.innerHTML = modalHTML;
        document.body.appendChild(tempModal);
        
        // Add event listeners
        const form = tempModal.querySelector('#edit-profile-form');
        const cancelBtn = tempModal.querySelector('#cancel-profile-modal');
        const saveBtn = tempModal.querySelector('#save-profile-modal');
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(tempModal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleProfileUpdateFromModal();
            document.body.removeChild(tempModal);
        });
        
        // Show the modal
        tempModal.classList.remove('hidden');
    });
}

// Show change password modal
function showChangePasswordModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="modal-content user-modal-content">
            <h3>Change Password</h3>
            <form id="change-password-modal-form">
                <div class="modal-form-field">
                    <label for="modal-current-password">Current Password</label>
                    <input type="password" id="modal-current-password" placeholder="Enter current password" required>
                </div>
                <div class="modal-form-field">
                    <label for="modal-new-password">New Password</label>
                    <input type="password" id="modal-new-password" placeholder="Enter new password" required>
                </div>
                <div class="modal-form-field">
                    <label for="modal-confirm-password">Confirm New Password</label>
                    <input type="password" id="modal-confirm-password" placeholder="Confirm new password" required>
                </div>
                <div class="modal-actions">
                    <button type="button" id="cancel-password-modal" class="secondary-button">Cancel</button>
                    <button type="submit" id="save-password-modal" class="button">Change Password</button>
                </div>
            </form>
        </div>
    `;
    
    // Show modal using existing modal system
    import('./modal.js').then(modal => {
        // Create a temporary modal container
        const tempModal = document.createElement('div');
        tempModal.id = 'change-password-modal';
        tempModal.className = 'modal-backdrop';
        tempModal.innerHTML = modalHTML;
        document.body.appendChild(tempModal);
        
        // Add event listeners
        const form = tempModal.querySelector('#change-password-modal-form');
        const cancelBtn = tempModal.querySelector('#cancel-password-modal');
        const saveBtn = tempModal.querySelector('#save-password-modal');
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(tempModal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChangePasswordFromModal();
            document.body.removeChild(tempModal);
        });
        
        // Show the modal
        tempModal.classList.remove('hidden');
    });
}

// Handle profile update from modal
function handleProfileUpdateFromModal() {
    const user = getCurrentUser();
    if (!user) return;
    
    const fullName = document.getElementById('modal-full-name').value.trim();
    const email = document.getElementById('modal-email').value.trim();
    const phone = document.getElementById('modal-phone').value.trim();
    const address = document.getElementById('modal-address').value.trim();
    
    if (!fullName) {
        alert('Full name is required.');
        return;
    }
    
    if (!email) {
        alert('Email is required.');
        return;
    }
    
    import('./services/authService.js').then(authService => {
        try {
            const profileData = {
                fullName: fullName,
                email: email,
                phone: phone,
                address: address
            };
            
            authService.updateUserProfile(user.id, profileData);
            alert('Profile updated successfully!');
            
            // Update the user info display
            updateUserInfo();
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        }
    });
}

// Handle password change from modal
function handleChangePasswordFromModal() {
    const user = getCurrentUser();
    if (!user) return;
    
    const currentPassword = document.getElementById('modal-current-password').value;
    const newPassword = document.getElementById('modal-new-password').value;
    const confirmPassword = document.getElementById('modal-confirm-password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('All password fields are required.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
    }
    
    import('./services/authService.js').then(authService => {
        try {
            authService.changeUserPassword(user.id, currentPassword, newPassword);
            alert('Password changed successfully!');
            
            // Clear the password fields
            document.getElementById('modal-current-password').value = '';
            document.getElementById('modal-new-password').value = '';
            document.getElementById('modal-confirm-password').value = '';
        } catch (error) {
            alert('Error changing password: ' + error.message);
        }
    });
}
