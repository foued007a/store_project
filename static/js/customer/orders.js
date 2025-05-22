document.addEventListener("DOMContentLoaded", function () {
  // Check if user is authenticated and has customer role
  if (!window.Auth.isAuthenticated()) {
    window.location.href = "../login.html";
    return;
  }

  const role = window.RoleRouter.getUserRole();
  if (role !== "customer") {
    window.location.href = "../admin/dashboard.html";
    return;
  }

  // DOM elements
  const usernameDisplay = document.getElementById("username-display");
  const logoutBtn = document.getElementById("logout-btn");
  const ordersContainer = document.getElementById("orders-container");

  // Display username
  usernameDisplay.textContent = "Customer";

  // Logout functionality
  logoutBtn.addEventListener("click", function () {
    window.Auth.logout();
    window.location.href = "../login.html";
  });

  // Fetch orders
  async function fetchOrders() {
    try {
      // Use the correct endpoint for customer sales
      const response = await window.Auth.apiRequest("/sales/");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const orders = await response.json();
      displayOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      ordersContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load orders. ${error.message}
                </div>
            `;
    }
  }

  // Display orders
  function displayOrders(orders) {
    if (orders.length === 0) {
      ordersContainer.innerHTML = `
                <div class="alert alert-info">
                    You haven't placed any orders yet. <a href="products.html">Start shopping</a>
                </div>
            `;
      return;
    }

    let html = "";
    orders.forEach((order) => {
      const date = new Date(order.date).toLocaleDateString();
      const statusClass = getStatusClass(order.status);

      let itemsHtml = "";
      order.items.forEach((item) => {
        itemsHtml += `
                    <div class="order-item">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6>${item.product.name}</h6>
                                <p class="text-muted small">${
                                  item.product.description || "No description"
                                }</p>
                            </div>
                            <div class="text-end">
                                <p>DA${item.price.toFixed(2)} x ${
          item.quantity
        }</p>
                                <p><strong>DA${(
                                  item.price * item.quantity
                                ).toFixed(2)}</strong></p>
                            </div>
                        </div>
                    </div>
                `;
      });

      html += `
                <div class="card order-card">
                    <div class="order-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5>Order #${order.id}</h5>
                            <p class="text-muted mb-0">Placed on ${date}</p>
                        </div>
                        <span class="badge ${statusClass} status-badge">${
        order.status
      }</span>
                    </div>
                    <div class="order-body">
                        <div class="order-items">
                            ${itemsHtml}
                        </div>
                    </div>
                    <div class="order-footer d-flex justify-content-between align-items-center">
                        <div>
                            <p class="mb-0"><strong>Total:</strong> DA${order.total.toFixed(
                              2
                            )}</p>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-danger print-order-btn" data-order-id="${order.id}">Print Receipt</button>
                        </div>
                      </div>
                </div>
            `;
    });

    ordersContainer.innerHTML = html;
  }

  // Get status badge class
  function getStatusClass(status) {
    if (!status) {
      return "bg-secondary";
    }

    switch (status.toLowerCase()) {
      case "completed":
        return "bg-success";
      case "processing":
        return "bg-warning";
      case "cancelled":
        return "bg-danger";
      case "pending":
        return "bg-info";
      default:
        return "bg-secondary";
    }
  }

  // Print order receipt
  function printOrderReceipt(orderId, orders) {
    const order = orders.find(o => o.id === parseInt(orderId));
    if (!order) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const date = new Date(order.date).toLocaleDateString();
    
    // Generate receipt HTML
    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td>${item.product.name}</td>
          <td>${item.quantity}</td>
          <td>DA${item.price.toFixed(2)}</td>
          <td>DA${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    });

    // Create the receipt content
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt #${order.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }
          .receipt-details {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .total {
            font-weight: bold;
            text-align: right;
            margin-top: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt {
              border: none;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h2>Store Project</h2>
            <h3>Order Receipt</h3>
          </div>
          <div class="receipt-details">
            <p><strong>Order #:</strong> ${order.id}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            <p>Total: DA${order.total.toFixed(2)}</p>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print();" style="padding: 10px 20px;">Print Receipt</button>
          </div>
        </div>
      </body>
      </html>
    `;

    // Write to the new window and print
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  }

  // Event delegation for print buttons
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('print-order-btn')) {
      const orderId = e.target.getAttribute('data-order-id');
      // Fetch orders again to ensure we have the latest data
      window.Auth.apiRequest('/sales/')
        .then(response => response.json())
        .then(orders => {
          printOrderReceipt(orderId, orders);
        })
        .catch(error => {
          console.error('Error fetching order data for printing:', error);
          alert('Failed to print receipt. Please try again.');
        });
    }
  });

  // Initialize
  fetchOrders();
});
