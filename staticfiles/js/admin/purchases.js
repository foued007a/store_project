document.addEventListener('DOMContentLoaded', function () {
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
    logoutBtn.addEventListener('click', function () {
        window.Auth.logout();
        window.location.href = '../login.html';
    });

    // DOM elements
    const purchaseForm = document.getElementById('purchase-form');
    const purchaseFormContainer = document.getElementById('purchase-form-container');
    const formTitle = document.getElementById('form-title');
    const addPurchaseBtn = document.getElementById('add-purchase-btn');
    const closeFormBtn = document.getElementById('close-form-btn');
    const purchasesTableBody = document.getElementById('purchases-table-body');
    const productSelect = document.getElementById('product-select');

    // Form fields
    const purchaseIdField = document.getElementById('purchase-id');
    const supplierNameField = document.getElementById('supplier-name');
    const purchaseDateField = document.getElementById('purchase-date');
    const quantityField = document.getElementById('quantity');
    const unitCostField = document.getElementById('unit-cost');
    const notesField = document.getElementById('notes');

    // Show/hide form
    function showForm(isEdit = false) {
        formTitle.textContent = isEdit ? 'Edit Purchase' : 'Record New Purchase';
        purchaseFormContainer.style.display = 'block';
    }

    function hideForm() {
        purchaseForm.reset();
        purchaseIdField.value = '';
        purchaseFormContainer.style.display = 'none';
    }

    // Add purchase button click
    addPurchaseBtn.addEventListener('click', function () {
        // Set today's date as default
        purchaseDateField.value = new Date().toISOString().split('T')[0];
        showForm(false);
    });

    // Close form button click
    closeFormBtn.addEventListener('click', hideForm);

    // Fetch products for dropdown
    async function fetchProducts() {
        try {
            const response = await window.Auth.apiRequest('/products/');

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const products = await response.json();
            populateProductDropdown(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            productSelect.innerHTML = '<option value="">Error loading products</option>';
        }
    }

    // Populate product dropdown
    function populateProductDropdown(products) {
        let options = '<option value="">Select a product</option>';
        products.forEach(product => {
            options += `<option value="${product.id}">${product.name}</option>`;
        });
        productSelect.innerHTML = options;
    }

    // Fetch purchases
    async function fetchPurchases() {
        try {
            const response = await window.Auth.apiRequest('/purchases/');

            if (!response.ok) {
                throw new Error('Failed to fetch purchases');
            }

            const purchases = await response.json();
            displayPurchases(purchases);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            purchasesTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-danger">
                        Failed to load purchases. ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    // Display purchases in table
    function displayPurchases(purchases) {
        if (purchases.length === 0) {
            purchasesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No purchases found.</td></tr>';
            return;
        }

        renderPurchases(purchases);
    }

    // Render purchases in table
    function renderPurchases(purchases) {
        if (!Array.isArray(purchases) || purchases.length === 0) {
            purchasesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No purchases found.</td></tr>';
            return;
        }
        purchasesTableBody.innerHTML = '';
        purchases.forEach(purchase => {
            const date = purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '';
            const supplier = purchase.supplier || '';
            const productName = purchase.product && purchase.product.name ? purchase.product.name : '';
            const unitCost = typeof purchase.unit_cost === 'number' ? purchase.unit_cost : Number(purchase.unit_cost);
            const totalCost = typeof purchase.total_cost === 'number' ? purchase.total_cost : (unitCost * purchase.quantity);
            const row = `<tr>
                <td>${purchase.id}</td>
                <td>${date}</td>
                <td>${supplier}</td>
                <td>${productName}</td>
                <td>${purchase.quantity}</td>
                <td>DA${unitCost.toFixed(2)}</td>
                <td>DA${totalCost.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary edit-purchase-btn" data-id="${purchase.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-purchase-btn" data-id="${purchase.id}">Delete</button>
                </td>
            </tr>`;
            purchasesTableBody.innerHTML += row;
        });
        // Add event listeners for edit and delete buttons
        const editButtons = purchasesTableBody.querySelectorAll('.edit-purchase-btn');
        const deleteButtons = purchasesTableBody.querySelectorAll('.delete-purchase-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const purchaseId = this.getAttribute('data-id');
                editPurchase(purchaseId, purchases);
            });
        });
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const purchaseId = this.getAttribute('data-id');
                deletePurchase(purchaseId);
            });
        });
    }

    // Edit purchase
    function editPurchase(purchaseId, purchases) {
        const purchase = purchases.find(p => p.id === parseInt(purchaseId));
        console.log(purchase);
        console.log(purchaseId);
        console.log(purchases);

        if (!purchase) return;

        // Populate form
        purchaseIdField.value = purchase.id;
        supplierNameField.value = purchase.supplier;
        purchaseDateField.value = new Date(purchase.purchase_date).toISOString().split('T')[0];
        productSelect.value = purchase.product;
        quantityField.value = purchase.quantity;
        unitCostField.value = typeof purchase.unit_cost !== 'undefined' ? purchase.unit_cost : '';
        notesField.value = purchase.notes || '';

        showForm(true);
    }

    // Delete purchase
    async function deletePurchase(purchaseId) {
        if (!confirm('Are you sure you want to delete this purchase record?')) {
            return;
        }

        try {
            const response = await window.Auth.apiRequest(`/purchases/${purchaseId}/`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete purchase');
            }

            alert('Purchase record deleted successfully');
            fetchPurchases();
        } catch (error) {
            console.error('Error deleting purchase:', error);
            alert(`Failed to delete purchase: ${error.message}`);
        }
    }

    // Form submit
    purchaseForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const purchaseId = purchaseIdField.value;
        const isEdit = !!purchaseId;

        const purchaseData = {
            supplier: supplierNameField.value,
            date: purchaseDateField.value,
            product: parseInt(productSelect.value),
            quantity: parseInt(quantityField.value),
            unit_cost: parseFloat(unitCostField.value),
            notes: notesField.value
        };

        try {
            const url = isEdit ? `/purchases/${purchaseId}/` : '/purchases/';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await window.Auth.apiRequest(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(purchaseData)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEdit ? 'update' : 'create'} purchase record`);
            }

            alert(`Purchase record ${isEdit ? 'updated' : 'created'} successfully`);
            hideForm();
            fetchPurchases();
        } catch (error) {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} purchase:`, error);
            alert(`Failed to ${isEdit ? 'update' : 'create'} purchase record: ${error.message}`);
        }
    });

    // Initialize
    fetchProducts();
    fetchPurchases();
});
