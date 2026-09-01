// Forzar actualización del registro del SW
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js?v=5")
      .then((reg) => {
        reg.update(); // Fuerza al Service Worker a buscar actualizaciones
      })
      .catch((err) => console.error("Error al registrar Service Worker:", err));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usuarioInput = document.getElementById("usuario");
  const passwordInput = document.getElementById("password");
  const recuerdameCheckbox = document.getElementById("recuerdame");

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_9e4W-jSgJInp-lA--M-q3yU6U9Rz3lR-J0m5JkZ_z621A_v52aWl4K0X1-j92_U/exec"; 

  const recordado = localStorage.getItem("Recuerdame") === "true";
  if (recordado) {
    usuarioInput.value = localStorage.getItem("Usuario") || "";
    passwordInput.value = localStorage.getItem("Password") || "";
    recuerdameCheckbox.checked = true;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = usuarioInput.value.trim().toUpperCase();
    const password = passwordInput.value.trim();

    if (!usuario || !password) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (recuerdameCheckbox.checked) {
      localStorage.setItem("Usuario", usuario);
      localStorage.setItem("Password", password);
      localStorage.setItem("Recuerdame", "true");
    } else {
      localStorage.removeItem("Usuario");
      localStorage.removeItem("Password");
      localStorage.removeItem("Recuerdame");
    }

    try {
      const url = `${SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(usuario)}`;
      const response = await fetch(url);
      const data = await response.json();

      let passRemota = "";

      if (Array.isArray(data) && data.length > 0 && data[0].columna2 !== undefined) {
        passRemota = String(data[0].columna2).trim();
      }

      if (passRemota === password) {
        window.location.href = `menu_principal.html?startValue=${encodeURIComponent(usuario)}`;
      } else {
        alert("Verifica tus credenciales");
      }
    } catch (error) {
      console.error("Error al consultar el servicio:", error);
      alert("Error al conectar con el servidor. Revisa tu conexión.");
    }
  });
});
