/* Coach RVB - cambio de contraseña de la cuenta autenticada.
   POST envía las contraseñas en el cuerpo, nunca en la URL.
   JSONP GET únicamente consulta el resultado, sin devolver contraseñas. */
const URL_API_CAMBIO =
  "https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec";
let secuenciaEstadoCambio = 0;
const $ = id => document.getElementById(id);
const dormir = ms => new Promise(resolve => setTimeout(resolve, ms));

function sesionCoachCambio() {
  try {
    return JSON.parse(sessionStorage.getItem("rvb_coach_sesion") || "null");
  } catch (_) { return null; }
}

function informarCambio(texto, clase = "") {
  $("estadoCambio").textContent = texto;
  $("estadoCambio").className = clase;
}

function consultarCambio(solicitudId, token) {
  return new Promise((resolve, reject) => {
    const callback = `rvbAlta_${Date.now()}${++secuenciaEstadoCambio}`;
    const script = document.createElement("script");
    const url = new URL(URL_API_CAMBIO);
    let terminado = false;
    let temporizador;
    function limpiar() {
      if (terminado) return false;
      terminado = true;
      clearTimeout(temporizador);
      script.remove();
      delete window[callback];
      return true;
    }
    window[callback] = r => { if (limpiar()) resolve(r); };
    script.onerror = () => { if (limpiar()) reject(new Error("No se pudo consultar el servidor.")); };
    temporizador = setTimeout(() => {
      if (limpiar()) reject(new Error("Se agotó el tiempo de consulta."));
    }, 20000);
    url.searchParams.set("accion", "estadoCambioContrasena");
    url.searchParams.set("solicitudId", solicitudId);
    url.searchParams.set("token", token);
    url.searchParams.set("callback", callback);
    url.searchParams.set("_", String(Date.now()));
    script.crossOrigin = "anonymous";
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

async function guardarEnGestor(usuario, nueva) {
  if (localStorage.getItem("Recuerdame") !== "true") return;
  if (typeof PasswordCredential !== "function" ||
      !navigator.credentials || typeof navigator.credentials.store !== "function") return;
  try {
    await navigator.credentials.store(new PasswordCredential({
      id: usuario, password: nueva, name: usuario
    }));
  } catch (error) {
    // No impedir el cambio en Sheets si el navegador no permite guardar.
    console.info("El navegador no pudo actualizar la contraseña guardada:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sesion = sesionCoachCambio();
  if (!sesion?.token || !sesion?.usuario || Number(sesion.exp) <= Date.now()) {
    window.location.replace("index.html");
    return;
  }
  $("usuarioConectado").textContent = sesion.usuario;
  $("btnVolverMenu").addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });

  $("formCambiarContrasena").addEventListener("submit", async evento => {
    evento.preventDefault();
    const actual = $("passwordActual").value;
    const nueva = $("passwordNueva").value;
    const confirmar = $("passwordConfirmar").value;
    const boton = $("btnGuardarContrasena");

    if (!actual) return informarCambio("Introduce tu contraseña actual.", "error");
    if (nueva.length < 8 || nueva.length > 128 || nueva.trim() !== nueva) {
      return informarCambio("La nueva contraseña debe tener entre 8 y 128 caracteres y no comenzar ni terminar en espacios.", "error");
    }
    if (nueva === actual) return informarCambio("La contraseña nueva debe ser diferente.", "error");
    if (nueva !== confirmar) return informarCambio("Las dos contraseñas nuevas no coinciden.", "error");

    boton.disabled = true;
    boton.textContent = "Guardando...";
    informarCambio("Actualizando contraseña...");
    const solicitudId = crypto.randomUUID();
    try {
      await fetch(URL_API_CAMBIO, {
        method: "POST", mode: "no-cors", credentials: "omit", cache: "no-store",
        body: new URLSearchParams({
          accion: "cambiarContrasena",
          solicitudId,
          token: sesion.token,
          passwordActual: actual,
          passwordNueva: nueva
        })
      });
      let confirmado = false;
      for (let i = 0; i < 15; i++) {
        const r = await consultarCambio(solicitudId, sesion.token);
        if (!r?.ok) throw new Error(r?.error || "No se pudo comprobar el cambio.");
        if (r.estado === "error") throw new Error(r.error || "No se ha podido cambiar la contraseña.");
        if (r.estado === "ok") { confirmado = true; break; }
        await dormir(700);
      }
      if (!confirmado) throw new Error("No se ha podido confirmar el guardado. Revisa el acceso antes de reintentarlo.");

      await guardarEnGestor(sesion.usuario, nueva);
      $("passwordActual").value = "";
      $("passwordNueva").value = "";
      $("passwordConfirmar").value = "";
      informarCambio("Contraseña cambiada correctamente. Puedes seguir utilizando la sesión actual. En el próximo login utiliza la nueva contraseña.", "exito");
    } catch (error) {
      console.error("Cambio de contraseña:", error);
      informarCambio(error?.message || "No se pudo completar el cambio.", "error");
    } finally {
      boton.disabled = false;
      boton.textContent = "Guardar contraseña";
    }
  });
});
