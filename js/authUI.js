// js/authUI.js

import { registerUser, loginUser, sendPasswordReset, getCurrentUser, updateUserProfile, changeUserPassword } from './services/authService.js';
import { loadStateFromFirestore } from './services/storageService.js';
import { renderAll } from './ui.js';

const mainContent = document.querySelector('main');
const header = document.querySelector('header');

/**
 * Shows the main application view and hides the authentication screen.
 */
export function showMainApp() {
    // Remove auth container if it exists
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.remove();
    }

    // Show the main app content
    if (header) header.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'grid';

    // Load data, render UI, and set up user info in the header
    renderAll();
    updateUserInfo();
}

/**
 * Shows the authentication screen and hides the main application view.
 */
export function showAuthScreen() {
    // Hide main app content
    if (header) header.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';

    // Remove old auth container if it exists
    const existingAuthContainer = document.getElementById('auth-container');
    if (existingAuthContainer) {
        existingAuthContainer.remove();
    }
    
    // Create and inject the auth UI
    const authContainer = document.createElement('div');
    authContainer.id = 'auth-container';
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
            <div id="auth-form-content"></div>
        </div>
    `;
    document.body.appendChild(authContainer);
    
    // Load the login form by default and set up tab listeners
    showLoginForm();
    document.getElementById('login-tab').addEventListener('click', showLoginForm);
    document.getElementById('register-tab').addEventListener('click', showRegisterForm);
}

function showLoginForm() {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    
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
            <button type="submit" class="auth-btn cta-button">Login</button>
            <div class="auth-links">
                <a href="#" id="forgot-password-link">Forgot Password?</a>
            </div>
            <div id="login-error" class="auth-error"></div>
        </form>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt("Please enter your email to receive a password reset link:");
        if (email) {
            sendPasswordReset(email);
        }
    });
}

function showRegisterForm() {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    
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
            <button type="submit" class="auth-btn cta-button">Register</button>
            <div id="register-error" class="auth-error"></div>
        </form>
    `;
    
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    try {
        errorElement.textContent = '';
        await loginUser(email, password);
        // The onAuthStateChanged listener in main.js will handle showing the app
    } catch (error) {
        errorElement.textContent = error.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorElement = document.getElementById('register-error');
    
    try {
        errorElement.textContent = '';
        const user = await registerUser(fullName, email, password);
        if (user) {
            alert('Registration successful! Please login with your new credentials.');
            showLoginForm();
        }
    } catch (error) {
        errorElement.textContent = error.message;
    }
}

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        let userInfo = document.getElementById('user-info');
        if (!userInfo) {
            userInfo = document.createElement('div');
            userInfo.id = 'user-info';
            userInfo.className = 'user-info';
            header.appendChild(userInfo);
        }
        
        userInfo.innerHTML = `
            <div class="user-info-content">
                <span class="user-name">${user.fullName || user.email} <i class="fas fa-cog settings-icon" id="settings-icon"></i></span>
            </div>
            <div class="user-dropdown" id="user-dropdown">
                <button id="logout-btn" class="dropdown-item logout">Logout</button>
            </div>
        `;

        const userContent = userInfo.querySelector('.user-info-content');
        const userDropdown = userInfo.querySelector('#user-dropdown');
        
        userContent.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
             import('./services/authService.js').then(authService => {
                authService.logoutUser();
                // The onAuthStateChanged listener in main.js will handle showing the auth screen
            });
        });

        document.addEventListener('click', (e) => {
            if (userDropdown && !userContent.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
}

// NOTE: We no longer need hideAuthScreen() or hideMainApp() because the two main functions handle everything.