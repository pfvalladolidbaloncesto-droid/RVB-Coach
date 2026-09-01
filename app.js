// URL de la API de Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";

// ==========================================
// 1. REGISTRO Y CONTROL DE SERVICE WORKER
// ==========================================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then((reg) => {
    // Escuchar si se detecta un nuevo Service Worker (nueva versión)
    reg.onupdatefound = () => {
      const installingWorker = reg.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // Si ya había un Service Worker activo y hay uno nuevo, recargar para aplicar cambios
              window.location.reload();
            }
          }
        };
      }
    };
  }).catch((err) => console.error("Error al registrar Service Worker:", err));
}

// ==========================================
// 2. LÓGICA PRINCIPAL AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const campoTexto = document.getElementById("campoTexto");
  const campoPassword = document.getElementById("campoPassword");
  const casillaVerificacion = document.getElementById("casillaVerificacion");
  const loginForm = document.getElementById("loginForm");

  // === INICIALIZACIÓN (Equivalente a Screen1.Initialize) ===
  const savedData = localStorage.getItem("check");
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      // Si la estructura existe y contiene credenciales guardadas
      if (parsed && (parsed.Usuario || parsed.Contraseña)) {
        campoTexto.value = parsed.Usuario || "";
        campoPassword.value = parsed.Contraseña || "";
        casillaVerificacion.checked = true;
      } else {
        casillaVerificacion.checked = false;
      }
    } catch (e) {
      casillaVerificacion.checked = false;
    }
  } else {
    casillaVerificacion.checked = false;
  }

  // === EVENTO AL ENVIAR FORMULARIO (Equivalente a Enviar.Click) ===
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = campoTexto.value;
    const password = campoPassword.value;

    // Guardar último usuario ingresado (TinyBD1.StoreValue "Usuario")
    localStorage.setItem("Usuario", usuario);

    // Guardar o limpiar credenciales según casilla de verificación
    if (casillaVerificacion.checked) {
      localStorage.setItem("check", JSON.stringify({
        Usuario: usuario,
        Contraseña: password
      }));
    } else {
      localStorage.setItem("check", JSON.stringify({
        Usuario: "",
        Contraseña: ""
      }));
    }

    // Petición al endpoint de Google Apps Script (Web1.Url + Web1.Get)
    const url = `${SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(usuario)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Procesamiento de respuesta (Equivalente a Web1.GotText)
      let passRemota = "not found";
      if (Array.isArray(data) && data.length > 0 && data[0].columna2 !== undefined) {
        passRemota = data[0].columna2;
      }

      // Validar si la contraseña obtenida coincide con la ingresada
      if (passRemota === password) {
        // Redirigir a la siguiente pantalla pasando el usuario (Start Value)
        window.location.href = `menu_principal.html?startValue=${encodeURIComponent(usuario)}`;
      } else {
        alert("Verifica tus credenciales");
      }
    } catch (error) {
      console.error("Error al consultar el servicio:", error);
      alert("Error al conectar con el servicio. Intenta nuevamente.");
    }
  });
});
