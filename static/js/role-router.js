// Role-based routing for the store project

// Function to decode JWT token and extract payload
function decodeJWT(token) {
    try {
        // JWT tokens are made of three parts: header.payload.signature
        // We only need the payload part which is the second part
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
    }
}

// Function to get user role from token
function getUserRole() {
    const tokens = JSON.parse(localStorage.getItem('auth_tokens'));
    if (!tokens || !tokens.access) {
        return null;
    }
    
    const decodedToken = decodeJWT(tokens.access);
    return decodedToken ? decodedToken.role : null;
}

// Function to redirect based on role
function redirectBasedOnRole() {
    // Check if user is authenticated
    if (!window.Auth.isAuthenticated()) {
        if (!window.location.pathname.endsWith('/login.html')) {
            window.location.href = '/static/login.html';
        }
        return;
    }
    
    const role = getUserRole();
    const currentPath = window.location.pathname;
    
    // If on index page or login page, redirect based on role
    if (currentPath.endsWith('/index.html') || currentPath.endsWith('/login.html')) {
        if (role === 'owner' && !currentPath.endsWith('/admin/dashboard.html')) {
            window.location.href = '/static/admin/dashboard.html';
            return;
        } else if (role === 'customer' && !currentPath.endsWith('/customer/products.html')) {
            window.location.href = '/static/customer/products.html';
            return;
        }
    }
    
    // If in admin section but not admin role, redirect
    if (currentPath.includes('/admin/') && role !== 'owner') {
        if (!currentPath.endsWith('/customer/products.html')) {
            window.location.href = '/static/customer/products.html';
        }
        return;
    }
    
    // If in customer section but not customer role, redirect
    if (currentPath.includes('/customer/') && role !== 'customer') {
        if (!currentPath.endsWith('/admin/dashboard.html')) {
            window.location.href = '/static/admin/dashboard.html';
        }
        return;
    }
}

// Export the role router utilities
window.RoleRouter = {
    getUserRole,
    redirectBasedOnRole
};

// Auto-execute role-based redirection when script loads
document.addEventListener('DOMContentLoaded', redirectBasedOnRole);