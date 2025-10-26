// js/services/authService.js

/**
 * Authentication service for user login and registration using localStorage
 */

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
    try {
        const activeUser = localStorage.getItem('supplySyncActiveUser');
        return activeUser ? JSON.parse(activeUser) : null;
    } catch (error) {
        console.error('Error reading active user from localStorage:', error);
        return null;
    }
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
export function registerUser(fullName, email, password) {
    // Validate input
    if (!fullName || !email || !password) {
        throw new Error('All fields are required');
    }
    
    if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
    }
    
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    
    const users = getAllUsers();
    
    // Check if user already exists
    if (users[email]) {
        throw new Error('User with this email already exists');
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        fullName: fullName,
        email: email,
        password: password, // In a real app, this should be hashed
        createdAt: new Date().toISOString()
    };
    
    users[email] = newUser;
    
    if (saveUsers(users)) {
        return newUser;
    } else {
        throw new Error('Failed to save user data');
    }
}

// Login user
export function loginUser(email, password) {
    // Validate input
    if (!email || !password) {
        throw new Error('Email and password are required');
    }
    
    const users = getAllUsers();
    
    // Check if user exists
    const user = users[email];
    if (!user) {
        throw new Error('No user found with this email');
    }
    
    // Check password
    if (user.password !== password) { // In a real app, this should compare hashed passwords
        throw new Error('Incorrect password');
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

// Logout user
export function logoutUser() {
    setCurrentUser(null);
    // Clear any user-specific data
    localStorage.removeItem('supplySyncData');
}

// Validate email format
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!getCurrentUser();
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