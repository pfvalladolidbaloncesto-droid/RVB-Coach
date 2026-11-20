/* Coach RVB - login con sesión de servidor.
   El usuario introduce sus credenciales habituales UNA vez.
   Ninguna contraseña se almacena en localStorage. */
const URL_API_COACH = "https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec";
const CLAVE_SESION_COACH = "rvb_coach_sesion";
let secuenciaLogin = 0;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=8")
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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const usuarioInput = document.getElementById("usuario");
  const passwordInput = document.getElementById("password");
  const recuerda = document.getElementById("recuerdame");
  const boton = document.getElementById("btnAceptar");

  // Se mantiene Recuérdame para el nombre, pero no la contraseña.
  if (localStorage.getItem("Recuerdame") === "true") {
    usuarioInput.value = localStorage.getItem("Usuario") || "";
    recuerda.checked = true;
  }
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
      } else {
        localStorage.removeItem("Recuerdame");
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
