/*
 * Coach RVB · Finalizar lesiones
 * - Lee únicamente lesiones abiertas del equipo seleccionado.
 * - Actualiza exclusivamente H:L (Gravedad, Alta, Lesión, Descripción, Observaciones).
 * - No utiliza ni modifica la columna G (Entrada).
 */

// Pega aquí la URL /exec de la implementación NUEVA de Apps Script de altas.
const URL_API_ALTAS = "https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec";

const $ = id => document.getElementById(id);
let contadorJSONP = 0;
let lesionesPendientes = [];
let lesionActual = null;
let ocupada = false;

function equipoActual() {
  return String(localStorage.getItem("Equipo") || localStorage.getItem("equipoUsuario") || "").trim();
}

function hoyLocal() {
  const d = new Date();
  const dos = v => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

function estado(id, mensaje, clase = "") {
  const nodo = $(id);
  nodo.textContent = mensaje;
  nodo.className = `estado ${clase}`.trim();
}

function crearTexto(tag, valor, clase = "") {
  const nodo = document.createElement(tag);
  nodo.textContent = valor;
  if (clase) nodo.className = clase;
  return nodo;
}

function verificarConfiguracion() {
  if (!URL_API_ALTAS.startsWith("https://script.google.com/macros/s/") ||
      !URL_API_ALTAS.endsWith("/exec")) {
    throw new Error("Falta configurar la URL /exec del Apps Script de altas.");
  }
}

// JSONP sin credenciales de Google (compatibilidad comprobada en Chrome Android).
function consultarAPI(accion, parametros = {}) {
  return new Promise((resolve, reject) => {
    try { verificarConfiguracion(); } catch (error) { reject(error); return; }

    const callback = `rvbAlta_${Date.now()}${++contadorJSONP}`;
    const script = document.createElement("script");
    const url = new URL(URL_API_ALTAS);
    let terminado = false;
    let reloj;

    function limpiar() {
      if (terminado) return false;
      terminado = true;
      clearTimeout(reloj);
      script.remove();
      delete window[callback];
      return true;
    }

    window[callback] = respuesta => {
      if (limpiar()) resolve(respuesta);
    };
    script.onerror = () => {
      if (limpiar()) reject(new Error("No se pudo conectar con Apps Script."));
    };
    script.onload = () => {
      if (limpiar()) reject(new Error("El servidor no devolvió una respuesta JSONP válida."));
    };
    reloj = setTimeout(() => {
      if (limpiar()) reject(new Error("La consulta ha superado los 20 segundos."));
    }, 20000);

    url.searchParams.set("accion", accion);
    Object.entries(parametros).forEach(([clave, valor]) => {
      url.searchParams.set(clave, String(valor));
    });
    url.searchParams.set("callback", callback);
    url.searchParams.set("_", String(Date.now()));

    script.crossOrigin = "anonymous";
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

function ocultarFormulario() {
  lesionActual = null;
  $("bloque-formulario").classList.add("oculto");
}

function pintarPendientes() {
  const contenedor = $("lista-lesiones");
  contenedor.replaceChildren();

  if (!lesionesPendientes.length) {
    contenedor.appendChild(crearTexto("p", "No hay lesiones pendientes de alta para este equipo.", "nota"));
    return;
  }

  lesionesPendientes.forEach(registro => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "lesion" + (lesionActual?.firma === registro.firma &&
      lesionActual?.fila === registro.fila ? " activa" : "");
    boton.append(
      crearTexto("strong", `${registro.fecha} · ${registro.ubicacion}`),
      crearTexto("span", registro.usuario)
    );
    boton.addEventListener("click", () => seleccionarLesion(registro));
    contenedor.appendChild(boton);
  });
}

function seleccionarLesion(registro) {
  lesionActual = registro;
  $("lesion-seleccionada").textContent =
    `${registro.usuario} · ${registro.fecha} · ${registro.ubicacion}`;
  $("gravedad").value = ["1", "2", "3", "4", "5"].includes(String(registro.gravedad))
    ? String(registro.gravedad) : "";
  $("fecha-alta").value = hoyLocal();
  $("lesion").value = registro.lesion || "";
  $("descripcion").value = registro.descripcion || "";
  $("observaciones").value = registro.observaciones || "";
  estado("estado-guardar", "");
  $("bloque-formulario").classList.remove("oculto");
  pintarPendientes();
  $("bloque-formulario").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function cargarPendientes() {
  if (ocupada) return;

  const equipo = equipoActual();
  const clave = $("clave").value.trim();
  if (!equipo || !clave) {
    estado("estado-carga", "Selecciona un equipo en el menú e introduce la clave de entrenador.", "error");
    return;
  }

  ocupada = true;
  $("btn-cargar").disabled = true;
  estado("estado-carga", "Consultando lesiones pendientes...");
  try {
    const datos = await consultarAPI("pendientes", { equipo, clave });
    if (!datos || !datos.ok) throw new Error(datos?.error || "Respuesta incorrecta del servidor.");
    lesionesPendientes = Array.isArray(datos.registros) ? datos.registros : [];
    ocultarFormulario();
    pintarPendientes();
    estado("estado-carga", `${lesionesPendientes.length} lesión(es) pendiente(s) en ${equipo}.`, "exito");
  } catch (error) {
    lesionesPendientes = [];
    ocultarFormulario();
    $("lista-lesiones").replaceChildren(crearTexto("p", "No se pudieron cargar los registros.", "nota"));
    estado("estado-carga", error.message, "error");
  } finally {
    ocupada = false;
    $("btn-cargar").disabled = false;
  }
}

// Los POST no-cors son opacos: verificamos el resultado por una consulta separada.
async function comprobarEnvio(envioId, equipo, clave) {
  for (let intento = 0; intento < 12; intento++) {
    const r = await consultarAPI("estadoAlta", { envioId, equipo, clave });
    if (!r || !r.ok) throw new Error(r?.error || "Error al comprobar la actualización.");
    if (r.estado === "ok") return;
    if (r.estado === "error") throw new Error(r.error || "No se pudo guardar el alta.");
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("No se ha podido confirmar el guardado. Recarga la lista antes de reintentar.");
}

async function guardarAlta(evento) {
  evento.preventDefault();
  if (ocupada || !lesionActual) return;

  const equipo = equipoActual();
  const clave = $("clave").value.trim();
  const gravedad = $("gravedad").value;
  const alta = $("fecha-alta").value;
  const lesion = $("lesion").value.trim();
  const descripcion = $("descripcion").value.trim();
  const observaciones = $("observaciones").value.trim();

  if (!equipo || !clave || !["1", "2", "3", "4", "5"].includes(gravedad) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(alta) || !lesion || !descripcion) {
    estado("estado-guardar", "Completa gravedad, fecha de alta, lesión y descripción. Solo observaciones es opcional.", "error");
    return;
  }

  if (!window.confirm(`¿Finalizar la lesión de ${lesionActual.usuario} (${lesionActual.ubicacion})?`)) return;

  try { verificarConfiguracion(); } catch (error) {
    estado("estado-guardar", error.message, "error");
    return;
  }

  ocupada = true;
  $("btn-guardar").disabled = true;
  $("btn-cargar").disabled = true;
  estado("estado-guardar", "Guardando cambios en la hoja Alta lesiones...");

  const envioId = crypto.randomUUID();
  const parametros = new URLSearchParams({
    accion: "guardarAlta", equipo, clave, envioId,
    fila: String(lesionActual.fila), firma: lesionActual.firma,
    gravedad, alta, lesion, descripcion, observaciones
  });

  try {
    await fetch(URL_API_ALTAS, {
      method: "POST", mode: "no-cors", credentials: "omit", cache: "no-store", body: parametros
    });
    estado("estado-guardar", "Petición enviada. Verificando el guardado...");
    await comprobarEnvio(envioId, equipo, clave);
    estado("estado-guardar", "Alta confirmada y guardada en las columnas H–L.", "exito");
    // Recargar desde la hoja para que el registro ya finalizado desaparezca.
    lesionesPendientes = lesionesPendientes.filter(r =>
      !(r.fila === lesionActual.fila && r.firma === lesionActual.firma));
    ocultarFormulario();
    pintarPendientes();
    estado("estado-carga", "Alta guardada. La lesión ya no aparece entre las pendientes.", "exito");
  } catch (error) {
    estado("estado-guardar", error.message + " Comprueba la hoja antes de repetir el envío.", "error");
  } finally {
    ocupada = false;
    $("btn-guardar").disabled = false;
    $("btn-cargar").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("equipo").value = equipoActual();
  $("fecha-alta").value = hoyLocal();
  $("btn-volver").addEventListener("click", () => { location.href = "menu_principal.html"; });
  $("btn-cargar").addEventListener("click", cargarPendientes);
  $("form-alta").addEventListener("submit", guardarAlta);
  $("clave").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); cargarPendientes(); }
  });
  if (!equipoActual()) estado("estado-carga", "No hay equipo seleccionado. Vuelve al menú principal.", "error");
});
