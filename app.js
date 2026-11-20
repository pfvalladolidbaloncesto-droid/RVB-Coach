/* Coach RVB - login con sesión de servidor.
   La app SIEMPRE abre index.html al lanzarse desde el icono instalado.
   "Recuérdame" conserva el usuario y solicita guardar la contraseña
   en el gestor de contraseñas del navegador (NO en localStorage).
   Tras rellenar, el usuario debe pulsar Aceptar: no hay auto-login.
*/
const URL_API_COACH = "https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec";
const CLAVE_SESION_COACH = "rvb_coach_sesion";
let secuenciaLogin = 0;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=9")
      .then(reg => reg.update())
      .catch(err => console.warn("Service Worker:", err));
  });
}

function nuevaSolicitudId() {
  return crypto.randomUUID();
}

function respuestaLoginJSONP(solicitudId) {
  return new Promise((resolve, reject) => {
    const callback = `rvbAlta_${Date.now()}${++secuenciaLogin}`;
    const script = document.createElement("script");
    const url = new URL(URL_API_COACH);
    let finalizado = false;
    let reloj;

    function limpiar() {
      if (finalizado) return false;
      finalizado = true;
      clearTimeout(reloj);
      script.remove();
      delete window[callback];
      return true;
    }

    window[callback] = datos => {
      if (limpiar()) resolve(datos);
    };
    script.onerror = () => {
      if (limpiar()) reject(new Error("No se pudo consultar la sesión."));
    };
    script.onload = () => {
      if (limpiar()) reject(new Error("La respuesta de Apps Script no es válida."));
    };
    reloj = setTimeout(() => {
      if (limpiar()) reject(new Error("Tiempo de espera agotado."));
    }, 18000);

    url.searchParams.set("accion", "estadoLogin");
    url.searchParams.set("solicitudId", solicitudId);
    url.searchParams.set("callback", callback);
    url.searchParams.set("_", String(Date.now()));
    script.crossOrigin = "anonymous";
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

async function loginCoach(usuario, password) {
  const solicitudId = nuevaSolicitudId();
  await fetch(URL_API_COACH, {
    method: "POST",
    mode: "no-cors",
    credentials: "omit",
    cache: "no-store",
    body: new URLSearchParams({
      accion: "iniciarSesion", solicitudId, usuario, password
    })
  });

  for (let i = 0; i < 13; i++) {
    const respuesta = await respuestaLoginJSONP(solicitudId);
    if (!respuesta || !respuesta.ok) {
      throw new Error(respuesta?.error || "No se ha podido iniciar sesión.");
    }
    if (respuesta.estado === "error") {
      throw new Error(respuesta.error || "Credenciales incorrectas.");
    }
    if (respuesta.estado === "ok") return respuesta;
    await new Promise(resolve => setTimeout(resolve, 650));
  }
  throw new Error("No se pudo confirmar el inicio de sesión.");
}

// Solicita al gestor integrado que recuerde las credenciales tras
// un login correcto. El navegador decide si guardarlas y puede pedir permiso.
async function guardarContrasenaEnNavegador(usuario, password) {
  if (typeof PasswordCredential !== "function" ||
      !navigator.credentials ||
      typeof navigator.credentials.store !== "function") {
    // Otros navegadores pueden ofrecer guardar y rellenar por los
    // atributos HTML autocomplete="username" y "current-password".
    return;
  }
  try {
    const credencial = new PasswordCredential({
      id: usuario,
      password,
      name: usuario
    });
    await navigator.credentials.store(credencial);
  } catch (err) {
    // No impedir el login si el usuario rechaza guardar la contraseña.
    console.info("El navegador no guardó las credenciales:", err);
  }
}

// Al abrir index.html, intenta obtener la contraseña almacenada por el
// propio navegador. No valida ni inicia sesión automáticamente.
async function rellenarContrasenaRecordada(usuarioInput, passwordInput) {
  if (localStorage.getItem("Recuerdame") !== "true") return;
  if (!navigator.credentials ||
      typeof navigator.credentials.get !== "function") return;
  try {
    const credencial = await navigator.credentials.get({
      password: true,
      mediation: "silent"
    });
    if (!credencial || credencial.type !== "password" ||
        typeof credencial.password !== "string") return;

    const usuarioRecordado = (usuarioInput.value || "").trim();
    if (usuarioRecordado &&
        usuarioRecordado.toUpperCase() !== String(credencial.id).toUpperCase()) {
      return;
    }
    // No sustituir nada que el usuario ya haya empezado a escribir.
    if (document.activeElement === passwordInput || passwordInput.value) return;
    usuarioInput.value = credencial.id;
    passwordInput.value = credencial.password;
  } catch (err) {
    // Algunos navegadores solo permiten rellenar tras una interacción.
    // En ese caso queda disponible el autocompletado nativo del campo.
    console.info("Relleno automático no disponible:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usuarioInput = document.getElementById("usuario");
  const passwordInput = document.getElementById("password");
  const recuerda = document.getElementById("recuerdame");
  const boton = document.getElementById("btnAceptar");

  // Mantener index.html como pantalla de inicio, también con Recuérdame.
  // La contraseña solo se recupera del gestor del navegador, nunca de
  // localStorage. El campo seguirá siendo de tipo password (puntos).
  const recordado = localStorage.getItem("Recuerdame") === "true";
  recuerda.checked = recordado;
  if (recordado) {
    usuarioInput.value = localStorage.getItem("Usuario") || "";
    void rellenarContrasenaRecordada(usuarioInput, passwordInput);
  }
  // Limpiar contraseñas heredadas de versiones antiguas de la app.
  localStorage.removeItem("Password");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const usuario = usuarioInput.value.trim().toUpperCase();
    const password = passwordInput.value.trim();
    if (!usuario || !password) {
      alert("Introduce usuario y contraseña.");
      return;
    }
    boton.disabled = true;
    boton.textContent = "Conectando...";
    try {
      const datos = await loginCoach(usuario, password);
      if (!datos.token || !Number.isFinite(Number(datos.exp))) {
        throw new Error("El servidor no ha generado una sesión válida.");
      }
      sessionStorage.setItem(CLAVE_SESION_COACH, JSON.stringify({
        token: datos.token,
        usuario: datos.usuario,
        rol: datos.rol || "",
        equipo: datos.equipo || "",
        exp: Number(datos.exp)
      }));
      // Algunas pantallas existentes usan localStorage.Usuario durante
      // la sesión. Se borra al cerrar si Recuérdame no está activo.
      localStorage.setItem("Usuario", datos.usuario);
      if (recuerda.checked) {
        localStorage.setItem("Recuerdame", "true");
        // Solo guardamos la contraseña después de validar las credenciales.
        // Se entrega al gestor del navegador; no se copia a localStorage.
        await guardarContrasenaEnNavegador(datos.usuario || usuario, password);
      } else {
        localStorage.removeItem("Recuerdame");
        if (navigator.credentials?.preventSilentAccess) {
          // Deshabilita la recuperación silenciosa cuando no se recuerda.
          try { await navigator.credentials.preventSilentAccess(); }
          catch (_) { /* el login continúa con normalidad */ }
        }
      }
      localStorage.setItem("RolPorDefecto", datos.rol || "");
      localStorage.setItem("EquipoPorDefecto", datos.equipo || "");
      passwordInput.value = "";
      window.location.replace("menu_principal.html");
    } catch (err) {
      console.error("Fallo de autenticación:", err);
      alert(err.message || "Error al iniciar sesión.");
    } finally {
      boton.disabled = false;
      boton.textContent = "Aceptar";
    }
  });
});
