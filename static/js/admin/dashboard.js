document.addEventListener("DOMContentLoaded", function () {
  if (!window.Auth.isAuthenticated()) {
    window.location.href = "../login.html";
    return;
  }
  const usernameDisplay = document.getElementById("username-display");
  usernameDisplay.textContent = "Admin";
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", function () {
    window.Auth.logout();
  });
  async function fetchDashboardData() {
    try {
      const productResponse = await window.Auth.apiRequest("/products");
      if (productResponse.ok) {
        const productData = await productResponse.json();
        document.getElementById("product-count").textContent =
          productData.length;
      }
      const userResponse = await window.Auth.apiRequest("/users");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        document.getElementById("user-count").textContent = userData.length;
      }
      const salesResponse = await window.Auth.apiRequest("/sales");
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        document.getElementById("sales-count").textContent = salesData.length;
      }
      const purchaseResponse = await window.Auth.apiRequest("/purchases");
      if (purchaseResponse.ok) {
        const purchaseData = await purchaseResponse.json();
        document.getElementById("purchase-count").textContent =
          purchaseData.length;
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  const totalSalesEl = document.getElementById("total-sales");
  const ordersCountEl = document.getElementById("orders-count");
  const avgOrderValueEl = document.getElementById("avg-order-value");

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

  fetchSales();
  fetchDashboardData();
});
