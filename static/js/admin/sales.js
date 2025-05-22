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
    window.location.href = "../login.html";
  });

  // DOM elements
  const salesTableBody = document.getElementById("sales-table-body");
  const totalSalesEl = document.getElementById("total-sales");
  const ordersCountEl = document.getElementById("orders-count");
  const avgOrderValueEl = document.getElementById("avg-order-value");
  const filterForm = document.getElementById("filter-form");
  const resetFiltersBtn = document.getElementById("reset-filters");
  const paginationEl = document.getElementById("pagination");
  const showingEntriesEl = document.getElementById("showing-entries");
  const printReportBtn = document.getElementById("print-report-btn");

  // Modal elements
  const orderDetailsModal = new bootstrap.Modal(
    document.getElementById("order-details-modal")
  );
  const orderDetailsContent = document.getElementById("order-details-content");

  // Pagination state
  let currentPage = 1;
  const itemsPerPage =10;
  let totalItems = 0;

  // Filter state
  let filters = {
    dateFrom: "",
    dateTo: "",

  };

  // Fetch sales data
  async function fetchSales() {
    try {
      // In a real app, you would include filter parameters in the API request
      const response = await window.Auth.apiRequest("/sales/");

      if (!response.ok) {
        throw new Error("Failed to fetch sales data");
      }

      const salesData = await response.json();
      updateSalesSummary(salesData);
      displaySales(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      salesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        Failed to load sales data. ${error.message}
                    </td>
                </tr>
            `;
    }
  }

  // Update sales summary
  function updateSalesSummary(salesData) {
    const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
    const ordersCount = salesData.length;
    const avgOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

    totalSalesEl.textContent = 'DA '+`${totalSales.toFixed(2)}`;
    ordersCountEl.textContent = ordersCount;
    avgOrderValueEl.textContent = 'DA '+`${avgOrderValue.toFixed(2)}`;
  }

  // Display sales in table
  function displaySales(salesData) {
    totalItems = salesData.length;

    // Apply filters
    let filteredSales = salesData;
    if (filters.dateFrom) {
      filteredSales = filteredSales.filter(
        (sale) => new Date(sale.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filteredSales = filteredSales.filter(
        (sale) => new Date(sale.date) <= new Date(filters.dateTo)
      );
    }
    // if (filters.customerId) {
    //   filteredSales = filteredSales.filter(
    //     (sale) => sale.customer.id === parseInt(filters.customerId)
    //   );
    // }

    totalItems = filteredSales.length;

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedSales = filteredSales.slice(startIndex, endIndex);

    // Update showing entries text
    showingEntriesEl.textContent = `Showing ${
      startIndex + 1
    } to ${endIndex} of ${totalItems} entries`;

    // Generate pagination
    generatePagination();

    if (paginatedSales.length === 0) {
      salesTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">No sales found.</td></tr>';
      return;
    }

    let html = "";
    paginatedSales.forEach((sale) => {
      const date = new Date(sale.date).toLocaleDateString();
      html += `
                <tr>
                    <td>${sale.id}</td>
                    <td>${date}</td>
                    <td>${sale.customer}</td>
                    <td>${sale.items.length} items</td>
                    <td>DA${sale.total.toFixed(2)}</td>
                    <td><span class="badge ${getStatusBadgeClass(
                      sale.status
                    )}">${sale.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-info view-btn" data-id="${
                          sale.id
                        }">View</button>
                    </td>
                </tr>
            `;
    });

    salesTableBody.innerHTML = html;

    // Add event listeners to view buttons
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const saleId = this.getAttribute("data-id");
        viewOrderDetails(saleId, salesData);
      });
    });
  }

  // Generate pagination
  function generatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let html = "";

    // Previous button
    html += `
            <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" data-page="${
                  currentPage - 1
                }" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      html += `
                <li class="page-item ${currentPage === i ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
    }

    // Next button
    html += `
            <li class="page-item ${
              currentPage === totalPages ? "disabled" : ""
            }">
                <a class="page-link" href="#" data-page="${
                  currentPage + 1
                }" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;

    paginationEl.innerHTML = html;

    // Add event listeners to pagination links
    document.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const page = parseInt(this.getAttribute("data-page"));
        if (page >= 1 && page <= totalPages) {
          currentPage = page;
          fetchSales();
        }
      });
    });
  }

  // Get status badge class
  function getStatusBadgeClass(status) {
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

  // View order details
  function viewOrderDetails(saleId, salesData) {
    const sale = salesData.find((s) => s.id === parseInt(saleId));
    if (!sale) return;

    const date = new Date(sale.date).toLocaleString();
    let itemsHtml = "";

    sale.items.forEach((item) => {
      itemsHtml += `
                <tr>
                    <td>${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>DA${item.price.toFixed(2)}</td>
                    <td>DA${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
    });

    const statusOptions = ["Pending", "Processing", "Completed", "Cancelled"]
      .map(
        (status) =>
          `<option value="${status}" ${
            sale.status === status ? "selected" : ""
          }>${status}</option>`
      )
      .join("");

    orderDetailsContent.innerHTML = `
            <div class="mb-3">
                <h6>Order #${sale.id}</h6>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Customer:</strong> ${sale.customer} (${
      sale.customer.email
    })</p>
                <p><strong>Status:</strong> 
                    <select class="form-select form-select-sm d-inline-block w-auto" id="status-select">
                        ${statusOptions}
                    </select>
                </p>
            </div>
            <div class="table-responsive">
                <table class="table table-sm">
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
                    <tfoot>
                        <tr>
                            <th colspan="3" class="text-end">Total:</th>
                            <th>DA${sale.total.toFixed(2)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="mt-3">
                <h6>Shipping Address</h6>
                <p>${sale.shippingAddress || "No shipping address provided"}</p>
            </div>
            <div class="mt-3 d-flex justify-content-end">
                <button class="btn btn-danger print-receipt-btn" data-id="${sale.id}">Print Receipt</button>
            </div>
        `;


    orderDetailsModal.show();
  }


  // Print order receipt
  function printOrderReceipt(saleId, salesData) {
    const sale = salesData.find(s => s.id === parseInt(saleId));
    if (!sale) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const date = new Date(sale.date).toLocaleDateString();
    
    // Generate receipt HTML
    let itemsHtml = '';
    sale.items.forEach(item => {
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
        <title>Order Receipt #${sale.id}</title>
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
          .customer-info {
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
            <p><strong>Order #:</strong> ${sale.id}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Status:</strong> ${sale.status}</p>
          </div>
          <div class="customer-info">
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> ${sale.customer}</p>
            <p><strong>Email:</strong> ${sale.customer}</p>
            <p><strong>Shipping Address:</strong> ${sale.shippingAddress || "Not provided"}</p>
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
            <p>Total: DA${sale.total.toFixed(2)}</p>
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

    
  // Filter form submit
  filterForm.addEventListener("submit", function (e) {
    e.preventDefault();

    filters.dateFrom = document.getElementById("date-from").value;
    filters.dateTo = document.getElementById("date-to").value;

    currentPage = 1; // Reset to first page
    fetchSales();
  });

  // Reset filters
  resetFiltersBtn.addEventListener("click", function () {
    filterForm.reset();
    filters = {
      dateFrom: "",
      dateTo: "",
      // customerId: "",
    };

    currentPage = 1; // Reset to first page
    fetchSales();
  });

  // Event delegation for print receipt buttons
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('print-receipt-btn')) {
      const saleId = e.target.getAttribute('data-id');
      // Fetch sales data again to ensure we have the latest data
      window.Auth.apiRequest('/sales/')
        .then(response => response.json())
        .then(salesData => {
          printOrderReceipt(saleId, salesData);
        })
        .catch(error => {
          console.error('Error fetching sales data for printing:', error);
          alert('Failed to print receipt. Please try again.');
        });
    }
  });

  // Print sales report
  function printSalesReport(salesData) {
    // Apply current filters to the data
    let filteredSales = salesData;
    if (filters.dateFrom) {
      filteredSales = filteredSales.filter(
        (sale) => new Date(sale.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filteredSales = filteredSales.filter(
        (sale) => new Date(sale.date) <= new Date(filters.dateTo)
      );
    }
    // if (filters.customerId) {
    //   filteredSales = filteredSales.filter(
    //     (sale) => sale.customer.id === parseInt(filters.customerId)
    //   );
    // }

    // Calculate summary data
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const ordersCount = filteredSales.length;
    const avgOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    
    // Generate sales table HTML
    let salesRowsHtml = '';
    filteredSales.forEach((sale) => {
      const date = new Date(sale.date).toLocaleDateString();
      salesRowsHtml += `
        <tr>
          <td>${sale.id}</td>
          <td>${date}</td>
          <td>${sale.customer}</td>
          <td>${sale.items.length}</td>
          <td>DA${sale.total.toFixed(2)}</td>
          <td>${sale.status}</td>
        </tr>
      `;
    });

    // Create the report content
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report - ${currentDate}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .report {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          .report-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }
          .report-date {
            text-align: right;
            margin-bottom: 20px;
            font-style: italic;
          }
          .summary-cards {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .summary-card {
            width: 30%;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            text-align: center;
          }
          .summary-card h3 {
            margin-top: 0;
            color: #555;
          }
          .summary-card p {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
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
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="report-header">
            <h1>Sales Report</h1>
          </div>
          <div class="report-date">
            <p>Generated on: ${currentDate}</p>
            ${filters.dateFrom ? `<p>Period: ${filters.dateFrom} to ${filters.dateTo || 'Present'}</p>` : ''}
          </div>
          <div class="summary-cards">
            <div class="summary-card">
              <h3>Total Sales</h3>
              <p>DA${totalSales.toFixed(2)}</p>
            </div>
            <div class="summary-card">
              <h3>Orders Count</h3>
              <p>${ordersCount}</p>
            </div>
            <div class="summary-card">
              <h3>Average Order Value</h3>
              <p>DA${avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
          <h2>Sales Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${salesRowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <p>Store Project - Confidential Sales Report</p>
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print();" style="padding: 10px 20px;">Print Report</button>
          </div>
        </div>
      </body>
      </html>
    `;

    // Write to the new window and print
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }

  // Print report button click handler
  printReportBtn.addEventListener('click', function() {
    // Fetch latest sales data for the report
    window.Auth.apiRequest('/sales/')
      .then(response => response.json())
      .then(salesData => {
        printSalesReport(salesData);
      })
      .catch(error => {
        console.error('Error fetching sales data for report:', error);
        alert('Failed to generate sales report. Please try again.');
      });
  });

  // Initialize
  fetchSales();
});
