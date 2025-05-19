# Store Project Authentication System

## Overview

This project implements a complete authentication system for the Store Project using JWT (JSON Web Tokens). The system includes:

- Login and registration forms
- Secure JWT token storage in localStorage
- Automatic token inclusion in API requests
- Token refresh mechanism
- Protected routes based on authentication status

## Features

### Authentication Utilities (`auth.js`)

- **Token Storage**: Securely stores JWT tokens in localStorage with expiration handling
- **Token Refresh**: Automatically refreshes expired tokens
- **API Request Helper**: Includes authentication headers in all API requests
- **Authentication Status**: Provides methods to check if a user is authenticated

### User Interface

- **Login Page**: Clean form with error handling
- **Registration Page**: User registration with role selection
- **Dashboard**: Example of an authenticated page with protected content

## How to Use

### Setup

1. Make sure the Django backend is running
2. Access the frontend pages through the Django server

### Authentication Flow

1. Users register through the registration form
2. Users login to receive JWT tokens
3. Tokens are automatically included in subsequent API requests
4. Protected content is only shown to authenticated users

### API Integration

To make authenticated API requests in your JavaScript code:

```javascript
// Example of making an authenticated API request
async function fetchData() {
  try {
    const response = await window.Auth.apiRequest('/endpoint/');
    const data = await response.json();
    // Process data
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Security Considerations

- Tokens are stored with expiration times
- Automatic token refresh mechanism
- Failed authentication redirects to login
- API requests automatically include authentication headers

## File Structure

- `js/auth.js` - Core authentication utilities
- `login.html` - Login form
- `register.html` - Registration form
- `index.html` - Example dashboard with authentication integration
- `css/styles.css` - Shared styles for authentication pages