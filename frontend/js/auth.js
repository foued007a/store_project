const loginForm = document.getElementById("loginForm");
const errorDiv = document.getElementById("error");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:8000/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // حفظ الـ JWT token في localStorage
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);

            // إعادة التوجيه إلى لوحة التحكم
            window.location.href = "index.html";
        } else {
            errorDiv.textContent = data.error || "Login failed!";
        }
    } catch (err) {
        console.error(err);
        errorDiv.textContent = "Error connecting to server!";
    }
});
