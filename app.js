// Registrar Service Worker para PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js?v=6")
      .then((reg) => reg.update())
      .catch((err) => console.error("Error al registrar Service Worker:", err));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usuarioInput = document.getElementById("usuario");
  const passwordInput = document.getElementById("password");
  const recuerdameCheckbox = document.getElementById("recuerdame");

  // URL correcta de tu Web App de Google Apps Script
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec"; 

  // Cargar credenciales guardadas
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
      
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

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
      console.error("Error de conexión:", error);
      alert("Error al conectar con el servidor. Revisa tu conexión a internet.");
    }
  });
});
