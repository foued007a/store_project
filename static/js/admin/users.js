document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and has admin role
    if (!window.Auth.isAuthenticated()) {
        window.location.href = '../login.html';
        return;
    }
    
    // Display username
    const usernameDisplay = document.getElementById('username-display');
    usernameDisplay.textContent = 'Admin';
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', function() {
        window.Auth.logout();
        window.location.href = '../login.html';
    });
    
    // DOM elements
    const userForm = document.getElementById('user-form');
    const userFormContainer = document.getElementById('user-form-container');
    const formTitle = document.getElementById('form-title');
    const addUserBtn = document.getElementById('add-user-btn');
    const closeFormBtn = document.getElementById('close-form-btn');
    const usersTableBody = document.getElementById('users-table-body');
    
    // Form fields
    const userIdField = document.getElementById('user-id');
    const usernameField = document.getElementById('username');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const roleField = document.getElementById('role');
    
    // Show/hide form
    function showForm(isEdit = false) {
        formTitle.textContent = isEdit ? 'Edit User' : 'Add New User';
        userFormContainer.style.display = 'block';
    }
    
    function hideForm() {
        userForm.reset();
        userIdField.value = '';
        userFormContainer.style.display = 'none';
    }
    
    // Add user button click
    addUserBtn.addEventListener('click', function() {
        showForm(false);
    });
    
    // Close form button click
    closeFormBtn.addEventListener('click', hideForm);
    
    // Fetch users
    async function fetchUsers() {
        try {
            const response = await window.Auth.apiRequest('/users/');
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        Failed to load users. ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    // Display users in table
    function displayUsers(users) {
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
            return;
        }
        
        let html = '';
        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="badge ${user.role === 'owner' ? 'bg-danger' : 'bg-primary'}">${user.role}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${user.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${user.id}">Delete</button>
                    </td>
                </tr>
            `;
        });
        
        usersTableBody.innerHTML = html;
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                editUser(userId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                deleteUser(userId);
            });
        });
    }
    
    // Edit user
    async function editUser(userId) {
        try {
            const response = await window.Auth.apiRequest(`/users/${userId}/`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            
            const user = await response.json();
            
            // Populate form
            userIdField.value = user.id;
            usernameField.value = user.username;
            emailField.value = user.email;
            passwordField.value = ''; // Don't populate password
            roleField.value = user.role;
            
            showForm(true);
        } catch (error) {
            console.error('Error fetching user details:', error);
            alert(`Failed to load user details: ${error.message}`);
        }
    }
    
    // Delete user
    async function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            const response = await window.Auth.apiRequest(`/users/${userId}/`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            
            alert('User deleted successfully');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message}`);
        }
    }
    
    // Form submit
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userId = userIdField.value;
        const isEdit = !!userId;
        
        const userData = {
            username: usernameField.value,
            email: emailField.value,
            role: roleField.value
        };
        
        // Only include password if provided (for new users or password changes)
        if (passwordField.value) {
            userData.password = passwordField.value;
        }
        
        try {
            const url = isEdit ? `/users/${userId}/` : '/users/';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await window.Auth.apiRequest(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to ${isEdit ? 'update' : 'create'} user`);
            }
            
            alert(`User ${isEdit ? 'updated' : 'created'} successfully`);
            hideForm();
            fetchUsers();
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} user:`, error);
            alert(`Failed to ${isEdit ? 'update' : 'create'} user: ${error.message}`);
        }
    });
    
    // Initialize
    fetchUsers();
}); 