// js/services/authService.js

/**
 * Authentication service for user login and registration using localStorage
 */

// Import Firebase modules
import { auth } from '../firebase-config.js';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Get all users from localStorage
export function getAllUsers() {
    try {
        const usersData = localStorage.getItem('supplySyncUsers');
        return usersData ? JSON.parse(usersData) : {};
    } catch (error) {
        console.error('Error reading users from localStorage:', error);
        return {};
    }
}

// Save users to localStorage
export function saveUsers(users) {
    try {
        localStorage.setItem('supplySyncUsers', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Error saving users to localStorage:', error);
        return false;
    }
}

// Get current user session
export function getCurrentUser() {
    // We'll get user info from Firebase's current user object
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    // Adapt the Firebase user object to the structure our app expects
    return {
        id: firebaseUser.uid,
        fullName: firebaseUser.displayName,
        email: firebaseUser.email,
        // Add other fields as needed
    };
}

// Set current user session
export function setCurrentUser(user) {
    try {
        if (user) {
            localStorage.setItem('supplySyncActiveUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('supplySyncActiveUser');
        }
        return true;
    } catch (error) {
        console.error('Error setting active user in localStorage:', error);
        return false;
    }
}

// Register a new user
export async function registerUser(fullName, email, password) {
    if (!fullName || !email || !password) {
        throw new Error('All fields are required');
    }
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Add the user's full name to their Firebase profile
        await updateProfile(userCredential.user, {
            displayName: fullName
        });
        return userCredential.user;
    } catch (error) {
        // Firebase provides user-friendly error messages!
        console.error("Firebase registration error:", error.message);
        throw new Error(error.message); // Throw the error so the UI can catch it
    }
}

// Login user
export async function loginUser(email, password) {
    if (!email || !password) {
        throw new Error('Email and password are required');
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Firebase login error:", error.message);
        throw new Error(error.message);
    }
}

// Logout user
export async function logoutUser() {
    try {
        await signOut(auth);
        // Clear any local state if needed
        localStorage.removeItem('supplySyncActiveUser');
    } catch (error) {
        console.error("Firebase logout error:", error);
    }
}

// Validate email format
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!auth.currentUser;
}

// Get user data (companies, suppliers, etc.) from localStorage
export function getUserData(userId) {
    try {
        const userData = localStorage.getItem(`supplySyncUserData_${userId}`);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error reading user data from localStorage:', error);
        return null;
    }
}

// Save user data (companies, suppliers, etc.) to localStorage
export function saveUserData(userId, userData) {
    try {
        localStorage.setItem(`supplySyncUserData_${userId}`, JSON.stringify(userData));
        return true;
    } catch (error) {
        console.error('Error saving user data to localStorage:', error);
        return false;
    }
}

// Update user profile
export function updateUserProfile(userId, profileData) {
    try {
        const users = getAllUsers();
        const user = users[profileData.email];
        
        if (user && user.id !== userId) {
            throw new Error('Email is already in use by another account');
        }
        
        // Find the user by ID and update their profile
        let updatedUser = null;
        for (const email in users) {
            if (users[email].id === userId) {
                users[email] = {
                    ...users[email],
                    ...profileData
                };
                updatedUser = users[email];
                break;
            }
        }
        
        if (!updatedUser) {
            throw new Error('User not found');
        }
        
        if (saveUsers(users)) {
            // If this is the current user, update the session
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                const { password, ...userWithoutPassword } = updatedUser;
                setCurrentUser(userWithoutPassword);
            }
            return updatedUser;
        } else {
            throw new Error('Failed to save user data');
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

// Change user password
export function changeUserPassword(userId, currentPassword, newPassword) {
    try {
        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
        }
        
        const users = getAllUsers();
        let userFound = false;
        
        // Find the user by ID and check current password
        for (const email in users) {
            if (users[email].id === userId) {
                userFound = true;
                if (users[email].password !== currentPassword) {
                    throw new Error('Current password is incorrect');
                }
                users[email].password = newPassword;
                break;
            }
        }
        
        if (!userFound) {
            throw new Error('User not found');
        }
        
        if (saveUsers(users)) {
            return true;
        } else {
            throw new Error('Failed to save user data');
        }
    } catch (error) {
        console.error('Error changing user password:', error);
        throw error;
    }
}

export async function sendPasswordReset(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Please check your inbox.');
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

export { onAuthStateChanged };
