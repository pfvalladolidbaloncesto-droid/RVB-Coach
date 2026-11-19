/*
 * Coach RVB · Registro de lesiones
 * Formulario de Google, sin Apps Script adicional.
 * Una única región por registro.
 * Se conservan los identificadores exactos usados en el Excel.
 */

const URL_FORMULARIO_LESIONES =
  "https://docs.google.com/forms/d/e/1FAIpQLScLzsu7Ta7AZL7fojMHBcDcMAqpLKMrCHoHuftQUdOOpvlYZQ/formResponse";

const ENTRY_FECHA = "entry.620510486";
const ENTRY_USUARIO = "entry.1313408809";
const ENTRY_UBICACION = "entry.1950335938";

// Imagen bodymap_lesiones.png: 736 x 736 píxeles.
// Vista anterior a la izquierda; posterior a la derecha.
const ZONAS = [
  { nombre: "Cabeza", x: 160, y: 77 },
  { nombre: "Cuello", x: 160, y: 137 },
  { nombre: "Hombro_dch", x: 101, y: 171 },
  { nombre: "Hombro_izq", x: 221, y: 171 },
  { nombre: "Pecho", x: 160, y: 205 },
  { nombre: "Escápula_dch", x: 539, y: 193 },
  { nombre: "Escápula_izq", x: 440, y: 193 },
  { nombre: "Brazo_dch", x: 79, y: 242 },
  { nombre: "Brazo_izq", x: 244, y: 242 },
  { nombre: "Raquis_torax", x: 489, y: 241 },
  { nombre: "Codo_dch", x: 65, y: 305 },
  { nombre: "Codo_izq", x: 258, y: 305 },
  { nombre: "Antebrazo_dch", x: 54, y: 354 },
  { nombre: "Antebrazo_izq", x: 268, y: 354 },
  { nombre: "Abdomen", x: 161, y: 309 },
  { nombre: "Raquis_lumbar", x: 488, y: 314 },
  { nombre: "Muñeca_dch", x: 39, y: 396 },
  { nombre: "Muñeca_izq", x: 285, y: 396 },
  { nombre: "Mano_dch", x: 48, y: 428 },
  { nombre: "Mano_izq", x: 280, y: 428 },
  { nombre: "Cadera_dch", x: 126, y: 382 },
  { nombre: "Cadera_izq", x: 196, y: 382 },
  { nombre: "Pubis", x: 160, y: 413 },
  { nombre: "Glúteo_dch", x: 522, y: 407 },
  { nombre: "Glúteo_izq", x: 454, y: 407 },
  { nombre: "Cuádriceps_dch", x: 131, y: 468 },
  { nombre: "Cuádriceps_izq", x: 190, y: 468 },
  { nombre: "Isquio_dch", x: 520, y: 466 },
  { nombre: "Isquio_izq", x: 457, y: 466 },
  { nombre: "Rodilla_dch", x: 130, y: 535 },
  { nombre: "Rodilla_izq", x: 190, y: 535 },
  { nombre: "Poplíteo_dch", x: 524, y: 539 },
  { nombre: "Poplíteo_izq", x: 456, y: 539 },
  { nombre: "Tibia_dch", x: 130, y: 596 },
  { nombre: "Tibia_izq", x: 190, y: 596 },
  { nombre: "Gemelo_dch", x: 520, y: 591 },
  { nombre: "Gemelo_izq", x: 458, y: 591 },
  { nombre: "Tobillo_dch", x: 134, y: 653 },
  { nombre: "Tobillo_izq", x: 185, y: 653 },
  { nombre: "Talón_dch", x: 513, y: 659 },
  { nombre: "Talón_izq", x: 466, y: 659 },
  { nombre: "Pie_dch", x: 134, y: 683 },
  { nombre: "Pie_izq", x: 185, y: 683 }
];

const $ = id => document.getElementById(id);
const SVG_NS = "http://www.w3.org/2000/svg";
let zonaSeleccionada = "";
let envioEnCurso = false;

function fechaLocalHoy() {
  const d = new Date();
  const dos = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

function pintarMapa() {
  const svg = $("mapa-puntos");
  svg.replaceChildren();

  for (const vista of [
    { texto: "ANTERIOR", x: 160 },
    { texto: "POSTERIOR", x: 489 }
  ]) {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", vista.x);
    t.setAttribute("y", "723");
    t.setAttribute("class", "etiqueta-vista");
    t.textContent = vista.texto;
    svg.appendChild(t);
  }

  for (const zona of ZONAS) {
    const grupo = document.createElementNS(SVG_NS, "g");
    grupo.setAttribute("class", "punto");
    grupo.setAttribute("role", "button");
    grupo.setAttribute("tabindex", "0");
    grupo.setAttribute("aria-label", zona.nombre.replaceAll("_", " "));
    grupo.setAttribute("aria-pressed", "false");
    grupo.setAttribute("data-zona", zona.nombre);

    // Radio táctil ampliado para el móvil.
    const area = document.createElementNS(SVG_NS, "circle");
    area.setAttribute("cx", zona.x);
    area.setAttribute("cy", zona.y);
    area.setAttribute("r", "17");
    area.setAttribute("fill", "transparent");

    const marca = document.createElementNS(SVG_NS, "circle");
    marca.setAttribute("class", "marca");
    marca.setAttribute("cx", zona.x);
    marca.setAttribute("cy", zona.y);
    marca.setAttribute("r", "7.5");

    const titulo = document.createElementNS(SVG_NS, "title");
    titulo.textContent = zona.nombre;

    grupo.append(area, marca, titulo);
    grupo.addEventListener("click", () => seleccionarZona(zona.nombre));
    grupo.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        seleccionarZona(zona.nombre);
      }
    });
    svg.appendChild(grupo);
  }
}

function seleccionarZona(nombre) {
  if (nombre && !ZONAS.some(z => z.nombre === nombre)) return;

  zonaSeleccionada = nombre;
  $("ubicacion-lista").value = nombre;
  $("ubicacion-actual").textContent = nombre || "Ninguna";

  $("mapa-puntos").querySelectorAll(".punto").forEach(grupo => {
    const activo = grupo.dataset.zona === nombre;
    grupo.classList.toggle("seleccionado", activo);
    grupo.setAttribute("aria-pressed", activo ? "true" : "false");
  });
  informar("");
}

function informar(mensaje, tipo = "") {
  const estado = $("estado-envio");
  estado.textContent = mensaje;
  estado.className = tipo;
}

// Envía la petición directamente al mismo Google Forms utilizado
// por RVB. No se consulta ningún Apps Script adicional.
async function enviarRegistro(event) {
  event.preventDefault();
  if (envioEnCurso) return;

  const jugador = $("jugador").value.trim();
  const fecha = $("fecha").value;
  const ubicacion = zonaSeleccionada;

  if (!jugador || jugador === "Sin jugador seleccionado") {
    informar("Selecciona un jugador antes de registrar.", "error");
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    informar("Selecciona una fecha válida.", "error");
    return;
  }
  if (!ubicacion) {
    informar("Selecciona una única zona del mapa corporal.", "error");
    return;
  }

  // El enlace pre-rellenado facilitado por el usuario confirma estos
  // tres entry.* y el formato YYYY-MM-DD para la fecha.
  const parametros = new URLSearchParams({
    [ENTRY_FECHA]: fecha,
    [ENTRY_USUARIO]: jugador,
    [ENTRY_UBICACION]: ubicacion
  });

  const boton = $("btn-registrar");
  envioEnCurso = true;
  boton.disabled = true;
  boton.textContent = "Enviando...";
  informar("Enviando solicitud a Google Forms...");

  try {
    // Formulario público. Con no-cors no podemos leer la respuesta
    // ni asegurar desde JavaScript que Google haya guardado la fila.
    await fetch(URL_FORMULARIO_LESIONES, {
      method: "POST",
      mode: "no-cors",
      credentials: "omit",
      cache: "no-store",
      body: parametros
    });

    informar(
      `Solicitud enviada: ${jugador} · ${fecha} · ${ubicacion}. ` +
      "Verifica que aparece en la hoja de respuestas; " +
      "el navegador no puede confirmar el guardado.",
      "exito"
    );
    boton.textContent = "Solicitud enviada";
    // Mantener deshabilitado para evitar duplicados accidentales.
    // Para registrar otra lesión, volver al selector y abrir esta página.
  } catch (error) {
    console.error("Error al enviar lesión:", error);
    informar(
      "No se pudo completar la petición. Antes de volver a enviar, " +
      "comprueba que no exista ya en la hoja de respuestas.",
      "error"
    );
    envioEnCurso = false;
    boton.disabled = false;
    boton.textContent = "Registrar lesión";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const jugador = String(
    localStorage.getItem("User") ||
    localStorage.getItem("jugadorSeleccionado") || ""
  ).trim();

  $("jugador").value = jugador;
  $("fecha").value = fechaLocalHoy();

  $("btn-volver").addEventListener("click", () => {
    window.location.href = "selector.html";
  });

  const lista = $("ubicacion-lista");
  [...ZONAS]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .forEach(zona => {
      lista.add(new Option(zona.nombre.replaceAll("_", " "), zona.nombre));
    });

  lista.addEventListener("change", () => seleccionarZona(lista.value));
  pintarMapa();
  $("form-lesion").addEventListener("submit", enviarRegistro);

  if (!jugador) {
    informar("No hay jugador seleccionado. Vuelve al selector.", "error");
    $("btn-registrar").disabled = true;
  }
});
