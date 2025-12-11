document.addEventListener("DOMContentLoaded", function () {
  // Check if user is authenticated
  if (!window.Auth.isAuthenticated()) {
    window.location.href = "../login.html";
    return;
  }

  // DOM elements
  const usernameDisplay = document.getElementById("username-display");
  const logoutBtn = document.getElementById("logout-btn");
  const productsContainer = document.getElementById("products-container");
  const cartBtn = document.getElementById("cart-btn");
  const cartContainer = document.getElementById("cart-container");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("checkout-btn");

  // Cart data
  let cart = [];

  // Display username
  usernameDisplay.textContent = "Customer";

  // Logout functionality
  logoutBtn.addEventListener("click", function () {
    window.Auth.logout();
  });

  // Toggle cart sidebar
  cartBtn.addEventListener("click", function () {
    cartContainer.style.display =
      cartContainer.style.display === "block" ? "none" : "block";
  });

  closeCartBtn.addEventListener("click", function () {
    cartContainer.style.display = "none";
  });

  // Fetch products from API
  async function fetchProducts(searchTerm = "") {
    try {
      let endpoint = "/products/";
      if (searchTerm) {
        endpoint += `?search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await window.Auth.apiRequest(endpoint);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      productsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load products. ${error.message}
                </div>
            `;
    }
  }

  // Display products in grid
  function displayProducts(products) {
    if (products.length === 0) {
      productsContainer.innerHTML = "<p>No products available.</p>";
      return;
    }

    let html = "";
    products.forEach((product) => {
      html += `
                <div class="product-card">
                    <h5 class="alert alert-info">${product.name}</h5> 
                    <div class="d-flex">
                        <div class="flex-grow-1">
                         <h3>DA${Number(
                           product.price
                         ).toFixed(2)}</h3>
                        </div>
                         <p class="text-uppercase badge rounded-pill bg-warning text-dark" >${
                           product.category || "No category"
                         }</p>

                    </div>
                    <p calss="fs-6">${
                      product.description || "No description"
                    }</p>
                    
                    <p><strong>In Stock:</strong> ${product.stock}</p>
                    <button class="btn btn-danger add-to-cart-btn" data-id="${
                      product.id
                    }" data-name="${product.name}" data-price="${Number(
        product.price
      )}" data-stock="${product.stock}" ${product.stock <= 0 ? "disabled" : ""}>
                        ${product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                </div>
            `;
    });

    productsContainer.innerHTML = html;

    // Add event listeners to add-to-cart buttons
    document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const productId = parseInt(this.getAttribute("data-id"));
        const productName = this.getAttribute("data-name");
        const productPrice = parseFloat(this.getAttribute("data-price"));

        addToCart(productId, productName, productPrice);
      });
    });
  }

  // Add product to cart
  function addToCart(productId, productName, productPrice) {
    // Find the button to get current stock
    const productBtn = document.querySelector(
      `.add-to-cart-btn[data-id="${productId}"]`
    );
    const productStock = parseInt(productBtn.getAttribute("data-stock"));

    // Check if product is out of stock
    if (productStock <= 0) {
      alert("Sorry, this product is out of stock!");
      return;
    }

    // Check if product is already in cart
    const existingItem = cart.find((item) => item.id === productId);

    // Check if adding more would exceed available stock
    if (existingItem && existingItem.quantity >= productStock) {
      alert(`Sorry, only ${productStock} items available in stock!`);
      return;
    }

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: productPrice,
        quantity: 1,
      });
    }

    updateCart();
  }

  // Update cart display
  function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items display
    if (cart.length === 0) {
      cartItems.innerHTML = '<p class="text-center">Your cart is empty</p>';
      cartTotal.textContent = "$0.00";
      return;
    }

    let html = "";
    let total = 0;

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      html += `
                <div class="cart-item">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">DA${Number(item.price).toFixed(
                          2
                        )} each</small>
                    </div>
                    <div class="quantity-control">
                        <button class="btn btn-sm btn-outline-secondary decrease-btn" data-id="${
                          item.id
                        }">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary increase-btn" data-id="${
                          item.id
                        }">+</button>
                    </div>
                    <div>
                        DA${Number(itemTotal).toFixed(2)}
                        <button class="btn btn-sm btn-danger ms-3 remove-btn" data-id="${
                          item.id
                        }">×</button>
                    </div>
                </div>
            `;
    });

    cartItems.innerHTML = html;
    cartTotal.textContent = `DA${Number(total).toFixed(2)}`;

    // Add event listeners to cart item buttons
    document.querySelectorAll(".increase-btn").forEach((btn) => {
      const productId = parseInt(btn.getAttribute("data-id"));
      const item = cart.find((item) => item.id === productId);
      const productBtn = document.querySelector(
        `.add-to-cart-btn[data-id="${productId}"]`
      );
      const productStock = parseInt(productBtn.getAttribute("data-stock"));

      // Disable increase button if quantity reaches stock limit
      if (item && item.quantity >= productStock) {
        btn.disabled = true;
        btn.classList.add("disabled");
      } else {
        btn.disabled = false;
        btn.classList.remove("disabled");
      }

      btn.addEventListener("click", function () {
        const productId = parseInt(this.getAttribute("data-id"));
        increaseQuantity(productId);
      });
    });

    document.querySelectorAll(".decrease-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const productId = parseInt(this.getAttribute("data-id"));
        decreaseQuantity(productId);
      });
    });

    document.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const productId = parseInt(this.getAttribute("data-id"));
        removeFromCart(productId);
      });
    });
  }

  // Increase item quantity
  function increaseQuantity(productId) {
    const item = cart.find((item) => item.id === productId);
    if (item) {
      // Find the button to get current stock
      const productBtn = document.querySelector(
        `.add-to-cart-btn[data-id="${productId}"]`
      );
      const productStock = parseInt(productBtn.getAttribute("data-stock"));

      // Check if increasing would exceed available stock
      if (item.quantity >= productStock) {
        alert(`Sorry, only ${productStock} items available in stock!`);
        return;
      }

      item.quantity += 1;
      updateCart();
    }
  }

  // Decrease item quantity
  function decreaseQuantity(productId) {
    const item = cart.find((item) => item.id === productId);
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        removeFromCart(productId);
      } else {
        updateCart();
      }
    }
  }

  // Remove item from cart
  function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    updateCart();
  }

  // Checkout functionality
  checkoutBtn.addEventListener("click", async function () {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Set button to loading state
    const originalButtonText = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    checkoutBtn.disabled = true;

    try {
      // Get the current user's client ID
      const userResponse = await window.Auth.apiRequest("/clients/");
      if (!userResponse.ok) {
        throw new Error("Failed to get user information");
      }

      const clients = await userResponse.json();
      // Find the client that belongs to the current user
      const currentClient = clients.find(
        (client) => client.user === parseInt(localStorage.getItem("user_id"))
      );

      if (!currentClient) {
        throw new Error("Client information not found");
      }

      // Process each cart item as a separate sale
      const salePromises = cart.map(async (item) => {
        const saleData = {
          product: item.id,
          client: currentClient.id,
          quantity: item.quantity,
        };

        const response = await window.Auth.apiRequest("/sales/", {
          method: "POST",
          body: JSON.stringify(saleData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create sale");
        }

        return response.json();
      });

      // Wait for all sales to complete
      const results = await Promise.all(salePromises);

      // Clear the cart
      cart = [];
      updateCart();

      // Close the cart sidebar
      cartContainer.style.display = "none";

      // Show success message
      alert("Order placed successfully!");

      // Refresh products to update stock
      fetchProducts();
    } catch (error) {
      console.error("Checkout failed:", error);
      alert(`Checkout failed: ${error.message}`);
    } finally {
      // Reset button state regardless of success or failure
      checkoutBtn.innerHTML = originalButtonText;
      checkoutBtn.disabled = false;
    }
  });

  // Initialize page
  fetchProducts();
});
