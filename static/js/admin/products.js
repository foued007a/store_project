document.addEventListener("DOMContentLoaded", function () {
  // Check if user is authenticated and has admin role
  if (!window.Auth.isAuthenticated()) {
    window.location.href = "../login.html";
    return;
  }

  // Display username
  const usernameDisplay = document.getElementById("username-display");
  usernameDisplay.textContent = "Admin";

  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", function () {
    window.Auth.logout();
  });

  // DOM elements
  const addProductBtn = document.getElementById("add-product-btn");
  const closeFormBtn = document.getElementById("close-form-btn");
  const productFormContainer = document.getElementById(
    "product-form-container"
  );
  const productForm = document.getElementById("product-form");
  const formTitle = document.getElementById("form-title");
  const productsTableBody = document.getElementById("products-table-body");

  // Form fields
  const productIdField = document.getElementById("product-id");
  const productNameField = document.getElementById("product-name");
  const productDescriptionField = document.getElementById(
    "product-description"
  );
  const productPriceField = document.getElementById("product-price");
  const productCategorieField = document.getElementById("product-category");
  const productStockField = document.getElementById("product-stock");
  const productThresholdField = document.getElementById("product-threshold");

  // Show/hide product form
  addProductBtn.addEventListener("click", function () {
    formTitle.textContent = "Add New Product";
    resetForm();
    productFormContainer.style.display = "block";
  });

  closeFormBtn.addEventListener("click", function () {
    productFormContainer.style.display = "none";
  });

  // Reset form fields
  function resetForm() {
    productIdField.value = "";
    productForm.reset();
  }

  // Fetch all products
  async function fetchProducts() {
    try {
      const response = await window.Auth.apiRequest("/products/");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Failed to load products. ${error.message}
                    </td>
                </tr>
            `;
    }
  }

  // Display products in table
  function displayProducts(products) {
    if (products.length === 0) {
      productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No products available.</td>
                </tr>
            `;
      return;
    }

    let html = "";
    products.forEach((product) => {
      html += `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.description || "No description"}</td>
                    <td>${product.category || "No description"}</td>
                    <td>DA${Number(product.price).toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td>${product.low_stock_threshold || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-btn" data-id="${
                          product.id
                        }">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${
                          product.id
                        }">Delete</button>
                    </td>
                </tr>
            `;
    });

    productsTableBody.innerHTML = html;

    // Add event listeners to edit and delete buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const productId = this.getAttribute("data-id");
        editProduct(productId);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const productId = this.getAttribute("data-id");
        deleteProduct(productId);
      });
    });
  }

  // Edit product
  async function editProduct(productId) {
    try {
      const response = await window.Auth.apiRequest(`/products/${productId}/`);

      if (!response.ok) {
        throw new Error("Failed to fetch product details");
      }

      const product = await response.json();

      // Fill form with product data
      productIdField.value = product.id;
      productNameField.value = product.name;
      productDescriptionField.value = product.description || "";
      productPriceField.value = product.price;
      productStockField.value = product.stock;
      productCategorieField.value = product.category;
      productThresholdField.value = product.low_stock_threshold || 0;

      // Update form title and show form
      formTitle.textContent = "Edit Product";
      productFormContainer.style.display = "block";
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Failed to load product details. " + error.message);
    }
  }

  // Delete product
  async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await window.Auth.apiRequest(`/products/${productId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. " + error.message);
    }
  }

  // Handle form submission
  productForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const productData = {
      name: productNameField.value,
      description: productDescriptionField.value,
      price: parseFloat(productPriceField.value),
      category: productCategorieField.value,
      stock: parseInt(productStockField.value),
      low_stock_threshold: parseInt(productThresholdField.value),
    };

    const productId = productIdField.value;
    const isEditing = !!productId;

    try {
      let response;

      if (isEditing) {
        // Update existing product
        response = await window.Auth.apiRequest(`/products/${productId}/`, {
          method: "PUT",
          body: JSON.stringify(productData),
        });
      } else {
        // Create new product
        response = await window.Auth.apiRequest("/products/", {
          method: "POST",
          body: JSON.stringify(productData),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} product`);
      }

      // Hide form and refresh products list
      productFormContainer.style.display = "none";
      fetchProducts();
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "creating"} product:`,
        error
      );
      alert(
        `Failed to ${isEditing ? "update" : "create"} product. ${error.message}`
      );
    }
  });

  // Initialize page
  fetchProducts();
});
