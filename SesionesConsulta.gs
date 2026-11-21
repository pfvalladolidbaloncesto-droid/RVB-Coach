/*
 * RVB · Consulta de las últimas 6 sesiones (equipo / jugador)
 * ESTE ARCHIVO SE AÑADE AL MISMO PROYECTO DE APPS SCRIPT QUE
 * AppsScript_FinalizarLesion.gs (el backend de login/lesiones).
 * NO CONTIENE doGet(e): se utiliza el existente, con la rama consultarSesiones.
 * No modifica ninguna celda del Spreadsheet.
 */

// Claves normalizadas: sin acentos, en MAYÚSCULAS.
const CARPETAS_SESIONES_RVB = {
  "FILIAL_PISTA": "1-7UDm_-m7CqnqDhYfCjzT8WF57KRCSJT",
  "FILIAL_FISICO": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ",
  "DESARROLLO_PISTA": "1AIcgSlgSKzzV4Vf_mqHFAvQ_bmuFMv48",
  "DESARROLLO_FISICO": "1V5xaBsWPeo8jDdvrQeo33_bT1CCOaZSX",
  "JUNIOR A_PISTA": "1popwCXqp2NRuGDHPLqGUGavYZcjHoF4d",
  "JUNIOR A_FISICO": "17KMZF1tKwZYZB5fg2lpNdVN0F8g1jSle",
  "JUNIOR B_PISTA": "1N9l0FKZ3Bp4W8_F7TfEyT38cEggXEZRl",
  "JUNIOR B_FISICO": "1yPuV6bwl46gITw0AHJP3MA7YEhq2R8Gv",
  "CADETE A_PISTA": "1LgRPFVcKe8UKHbqoyi5yYLmCq4rucHz2",
  "CADETE A_FISICO": "1cHUj-F3JeKkoshtnKtWqgIuWVFnY1vjB",
  "CADETE B_PISTA": "18EANg_Wv3W8jgxkGe55Yk8OgTsZly319",
  "CADETE B_FISICO": "1_KgcdJe-T4MtFpqJyp9VZ9YyFygSx4Xa",
  "INFANTIL A_PISTA": "1PhY2dTw98_uVder7BzUXdLU5eT9Iu_8P",
  "INFANTIL A_FISICO": "1M1JUbcwUhsJoww0f0BPs8akjHZr4vK2A",
  "INFANTIL B_PISTA": "1ePmEXq2EYBcrUoKBmk4SIRRr2BQFbNyq",
  "INFANTIL B_FISICO": "1G44NviyutQ4CTPelgjxtHSKCGCI183ZJ"
};

function sesionClaveNormal_(v) {
  return String(v == null ? "" : v)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().replace(/\s+/g, " ").toUpperCase();
}

function sesionFechaISO_(valor, tz) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, tz, "yyyy-MM-dd");
  }
  const s = String(valor == null ? "" : valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);
  if (m) {
    // Cadena con día/mes/año. Las fechas de Sheets son Date y se manejan arriba.
    const dos = n => String(n).padStart(2,"0");
    return m[3] + "-" + dos(m[2]) + "-" + dos(m[1]);
  }
  return "";
}

function sesionClave_(equipo, entrenamiento, fecha) {
  return sesionClaveNormal_(equipo) + "|" +
    sesionClaveNormal_(entrenamiento) + "|" + fecha;
}

function consultarSesionesCoach_(p) {
  const equipo = String(p.equipo || "").trim();
  const tipo = sesionClaveNormal_(p.entrenamiento || "Todos");
  const fechaMax = String(p.fecha || "").trim();
  const modo = String(p.modo || "equipo").trim();
  const jugador = String(p.usuario || "").trim();
  if (!equipo || equipo.length > 100) throw new Error("Equipo no válido.");
  if (!/^(TODOS|PISTA|FISICO)$/.test(tipo)) throw new Error("Entrenamiento no válido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaMax)) throw new Error("Fecha no válida.");
  if (!/^(equipo|jugador)$/.test(modo)) throw new Error("Tipo de consulta no válido.");
  if (modo === "jugador" && (!jugador || jugador.length > 100)) throw new Error("Jugador no válido.");

  const ss = SpreadsheetApp.openById(SS_ID_ALTAS);
  const hoja = ss.getSheetByName("Sesion");
  if (!hoja) throw new Error("No existe la hoja Sesion.");
  const tz = ss.getSpreadsheetTimeZone();

  // Interpretación provisional de Sesiones Jugador: una sesión del equipo
  // en cuya fecha y tipo de entrenamiento el jugador tenga un registro en RPE.
  let clavesJugador = null;
  if (modo === "jugador") {
    clavesJugador = new Set();
    const hojaRpe = ss.getSheetByName("RPE");
    if (!hojaRpe) throw new Error("No existe la hoja RPE.");
    const nRpe = hojaRpe.getLastRow()-1;
    if(nRpe > 0) {
      // RPE E:H = Fecha, Nombre, Equipo, Entrenamiento.
      const filas = hojaRpe.getRange(2,5,nRpe,4).getValues();
      for (const r of filas) {
        if (sesionClaveNormal_(r[1]) !== sesionClaveNormal_(jugador)) continue;
        const f = sesionFechaISO_(r[0],tz);
        if (f && f <= fechaMax) clavesJugador.add(sesionClave_(r[2],r[3],f));
      }
    }
  }

  const n = hoja.getLastRow()-1;
  if(n <= 0) return [];
  const filas = hoja.getRange(2,1,n,5).getValues();
  const registros = [];
  for(let i=0;i<filas.length;i++) {
    const r = filas[i];
    const fecha = sesionFechaISO_(r[1],tz); // B
    const eq = String(r[2] || "").trim();  // C
    const entrenamiento = String(r[3] || "").trim(); // D
    if(!fecha || fecha > fechaMax) continue;
    if(sesionClaveNormal_(eq) !== sesionClaveNormal_(equipo)) continue;
    if(tipo !== "TODOS" && sesionClaveNormal_(entrenamiento) !== tipo) continue;
    if(clavesJugador && !clavesJugador.has(sesionClave_(eq,entrenamiento,fecha))) continue;
    const timestamp = r[0] instanceof Date && !isNaN(r[0].getTime())
      ? r[0].getTime() : i;
    registros.push({
      fecha, equipo:eq, entrenamiento,
      volumen:r[4] == null ? "" : String(r[4]),
      _timestamp:timestamp, _fila:i
    });
  }
  registros.sort((a,b)=>b.fecha.localeCompare(a.fecha)||b._timestamp-a._timestamp||b._fila-a._fila);
  const ultimos=registros.slice(0,6);
  buscarArchivosDeSesiones_(ultimos);
  return ultimos.map(r=>({
    fecha:r.fecha,
    fechaTexto:r.fecha.slice(8,10)+"/"+r.fecha.slice(5,7)+"/"+r.fecha.slice(0,4),
    equipo:r.equipo,
    entrenamiento:r.entrenamiento,
    volumen:r.volumen,
    documento:r.documento || null
  }));
}

function buscarArchivosDeSesiones_(registros) {
  const solicitudes = {};
  for (const r of registros) {
    const clave = sesionClaveNormal_(r.equipo) + "_" + sesionClaveNormal_(r.entrenamiento);
    const carpeta = CARPETAS_SESIONES_RVB[clave];
    if (!carpeta) continue;
    if (!solicitudes[carpeta]) solicitudes[carpeta] = [];
    solicitudes[carpeta].push(r);
  }
  Object.keys(solicitudes).forEach(carpetaId=>{
    const pendientes = solicitudes[carpetaId];
    const targets = new Set(pendientes.map(r=>(r.equipo+"-"+r.fecha).toLowerCase()));
    let archivos;
    try { archivos = DriveApp.getFolderById(carpetaId).getFiles(); }
    catch (error) { throw new Error("No se puede leer la carpeta Drive del equipo. Autoriza Drive en Apps Script. " + error.message); }
    const encontrados = {};
    while(archivos.hasNext()) {
      const file = archivos.next();
      const nombre = String(file.getName());
      const punto = nombre.lastIndexOf(".");
      const base = (punto >= 0 ? nombre.slice(0,punto) : nombre).toLowerCase();
      if(targets.has(base) && !encontrados[base]) {
        encontrados[base] = { nombre:nombre, url:file.getUrl() };
      }
    }
    pendientes.forEach(r=>{
      const k=(r.equipo+"-"+r.fecha).toLowerCase();
      r.documento=encontrados[k]||null;
    });
  });
}

/* Ejecutar UNA VEZ manualmente para conceder los nuevos permisos de Drive. */
function autorizarConsultaSesiones() {
  const ss=SpreadsheetApp.openById(SS_ID_ALTAS);
  const hoja=ss.getSheetByName("Sesion");
  if(!hoja) throw new Error("No existe la hoja Sesion.");
  Logger.log(hoja.getRange("A1:E1").getDisplayValues()[0].join(" | "));
  // No modifica ningún archivo: solo intenta leer la primera carpeta.
  const carpeta=DriveApp.getFolderById(CARPETAS_SESIONES_RVB["FILIAL_PISTA"]);
  Logger.log("Carpeta accesible: " + carpeta.getName());
}
