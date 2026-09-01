const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const campoTexto = document.getElementById("campoTexto");
  const campoPassword = document.getElementById("campoPassword");
  const casillaVerificacion = document.getElementById("casillaVerificacion");
  const loginForm = document.getElementById("loginForm");

  // === LÓGICA DE INICIALIZACIÓN (Screen1.Initialize) ===
  const savedData = localStorage.getItem("check");
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
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

  // Registramos el Service Worker para PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  }

  // === EVENTO AL PRESIONAR ENVIAR ===
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = campoTexto.value;
    const password = campoPassword.value;

    // 1. Guardar usuario actual
    localStorage.setItem("Usuario", usuario);

    // 2. Comprobar Checkbox y actualizar LocalStorage ("check")
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

    // 3. Petición HTTP al Google Apps Script (Reemplazo de Web1.Get)
    const url = `${SCRIPT_URL}?accion=consultar&num=${encodeURIComponent(usuario)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Equivalente a GotText: extrae columna2 del primer elemento del array
      let passRemota = "not found";
      if (Array.isArray(data) && data.length > 0 && data[0].columna2 !== undefined) {
        passRemota = data[0].columna2;
      }

      // Validar si coincide con la contraseña ingresada
      if (passRemota === password) {
        // Redirigir a la siguiente pantalla pasando el usuario en la URL (Start Value)
        window.location.href = `menu_principal.html?startValue=${encodeURIComponent(usuario)}`;
      } else {
        alert("Verifica tus credenciales");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("Error al conectar con el servicio. Intenta nuevamente.");
    }
  });
});
