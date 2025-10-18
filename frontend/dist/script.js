document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const API_URL = "http://localhost:8080/api/login";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  const msg = data.token;

  if (res.ok) {
    msg.textContent = "Login correcto, redirigiendo...";
    setTimeout(() => (globalThis.location.href = "success.html"), 1000);
  } else {
    msg.textContent = "[ERROR] " + data.message;
  }
});
