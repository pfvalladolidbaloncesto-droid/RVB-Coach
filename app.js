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

  // URL del Web App Executable de Google Apps Script
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfE74vQ5b_Dk744D6wO5xT2yR_e7X5sXy8x9/exec"; 

  // === CARGAR DATOS GUARDADOS (Si 'Recuérdame' estaba activo) ===
  const recordado = localStorage.getItem("Recuerdame") === "true";
  if (recordado) {
    usuarioInput.value = localStorage.getItem("Usuario") || "";
    passwordInput.value = localStorage.getItem("Password") || "";
    recuerdameCheckbox.checked = true;
  }

  // === EVENTO INICIO DE SESIÓN ===
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = usuarioInput.value.trim().toUpperCase();
    const password = passwordInput.value.trim();

    if (!usuario || !password) {
      alert("Por favor completa todos los campos");
      return;
    }

    // Guardar o limpiar credenciales en LocalStorage según el checkbox
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
      // Petición a la API de Apps Script
      const url = `${SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(usuario)}`;
      const response = await fetch(url);
      const data = await response.json();

      let passRemota = "not found";

      // Obtener el valor de la contraseña del JSON recibido
      if (Array.isArray(data) && data.length > 0 && data[0].columna2 !== undefined) {
        // CONVERSIÓN CRÍTICA: Convertir a String para evitar fallos con números (ej: 1 vs "1")
        passRemota = String(data[0].columna2).trim();
      }

      // Comparación exacta en formato String
      if (passRemota === password) {
        // Redirección a la pantalla de Menú Principal enviando el usuario activo
        window.location.href = `menu_principal.html?startValue=${encodeURIComponent(usuario)}`;
      } else {
        alert("Verifica tus credenciales");
      }
    } catch (error) {
      console.error("Error al consultar el servicio:", error);
      alert("Error al conectar con el servidor. Revisa tu conexión a internet.");
    }
  });
});
