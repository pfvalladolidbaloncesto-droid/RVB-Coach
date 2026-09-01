// Registrar Service Worker para PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Service Worker registrado con éxito:", reg.scope))
      .catch((err) => console.error("Error al registrar el Service Worker:", err));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usuarioInput = document.getElementById("usuario");
  const passwordInput = document.getElementById("password");
  const recuerdameCheckbox = document.getElementById("recuerdame");

  // ATENCIÓN: Sustituye la siguiente URL por TU URL REAL del despliegue de Google Apps Script
  const SCRIPT_URL = "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT"; 

  // Cargar datos guardados (Si 'Recuérdame' estaba activo)
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

      // Comprobar respuesta JSON
      if (Array.isArray(data) && data.length > 0 && data[0].columna2 !== undefined) {
        passRemota = String(data[0].columna2).trim();
      }

      // Comparación exacta
      if (passRemota === password) {
        window.location.href = `menu_principal.html?startValue=${encodeURIComponent(usuario)}`;
      } else {
        alert("Verifica tus credenciales");
      }
    } catch (error) {
      console.error("Error al consultar el servicio:", error);
      alert("Error al conectar con el servidor. Revisa que la SCRIPT_URL sea correcta y tengas conexión.");
    }
  });
});
