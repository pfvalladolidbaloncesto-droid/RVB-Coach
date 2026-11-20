/*
 Coach RVB · Inicio de sesión y alta de lesiones

 Se publica en la IMPLEMENTACIÓN EXISTENTE que ya tienes:
 https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec

 Una contraseña: la habitual del login (en el formulario inicial).
 El servidor entrega un token temporal tras autenticar; las consultas
 y escrituras de lesiones comprueban ese token.

 COLUMNA G: no se lee para identificar registros ni se modifica.
 Solo se escribe en H:L.

 Nota: esta protección cubre ESTE endpoint de lesiones. Es recomendable
 retirar la antigua implementación de login que devuelve contraseñas
 a clientes sin autenticar, si no la utilizan otras aplicaciones.
*/

const SS_ID_ALTAS = "1waAXuyLOYY7yp0WQzv17OTOPvcZ4uvuhKGkp1YdlOrQ";
const HOJA_ALTAS = "Alta lesiones";
const SESION_SEGUNDOS = 7200; // 2 horas
const ESTADO_SEGUNDOS = 300;  // 5 minutos para la confirmación

function doGet(e) {
  const p = (e && e.parameter) || {};
  let respuesta;
  try {
    if (p.accion === "estadoLogin") {
      validarSolicitud_(p.solicitudId);
      const guardado = CacheService.getScriptCache().get("login_" + p.solicitudId);
      respuesta = { ok: true, ...(guardado ? JSON.parse(guardado) : { estado: "pendiente" }) };
    } else if (p.accion === "pendientes") {
      exigirSesion_(p.token);
      respuesta = { ok: true, registros: obtenerPendientes_(p.equipo) };
    } else if (p.accion === "estadoAlta") {
      exigirSesion_(p.token);
      const envioId = String(p.envioId || "").trim();
      if (!/^[a-zA-Z0-9_-]{10,100}$/.test(envioId)) {
        throw new Error("Identificador de envío inválido.");
      }
      const guardado = CacheService.getScriptCache().get("rvbAlta_" + envioId);
      respuesta = { ok: true, ...(guardado ? JSON.parse(guardado) : { estado: "pendiente" }) };
    } else {
      throw new Error("Acción desconocida.");
    }
  } catch (error) {
    respuesta = { ok: false, error: String(error.message || error) };
  }
  const callback = String(p.callback || "");
  if (/^rvbAlta_[0-9]+$/.test(callback)) {
    return ContentService.createTextOutput(
      callback + "(" + JSON.stringify(respuesta) + ");"
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(respuesta))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const accion = String(p.accion || "");
  const cache = CacheService.getScriptCache();

  if (accion === "iniciarSesion") {
    let resultado;
    try {
      validarSolicitud_(p.solicitudId);
      const perfil = autenticarCoach_(p.usuario, p.password);
      const token = "RVB_" + Utilities.getUuid().replace(/-/g, "").toLowerCase() +
        Utilities.getUuid().replace(/-/g, "").toLowerCase();
      const exp = Date.now() + SESION_SEGUNDOS * 1000;
      cache.put("sesion_" + token, JSON.stringify({
        usuario: perfil.usuario, rol: perfil.rol, equipo: perfil.equipo, exp
      }), SESION_SEGUNDOS);
      resultado = { estado: "ok", token, usuario: perfil.usuario,
        rol: perfil.rol, equipo: perfil.equipo, exp };
    } catch (error) {
      // No distinguir entre usuario inexistente y contraseña incorrecta.
      resultado = { estado: "error", error: "Credenciales incorrectas o acceso bloqueado." };
    }
    if (/^[a-f0-9-]{36}$/i.test(String(p.solicitudId || ""))) {
      cache.put("login_" + p.solicitudId, JSON.stringify(resultado), ESTADO_SEGUNDOS);
    }
    return respuestaPOST_();
  }

  if (accion === "cerrarSesion") {
    if (/^RVB_[0-9a-f]{64}$/.test(String(p.token || ""))) {
      cache.remove("sesion_" + p.token);
    }
    return respuestaPOST_();
  }

  if (accion === "guardarAlta") {
    let estado;
    const id = String(p.envioId || "");
    try {
      exigirSesion_(p.token);
      guardarAlta_(p);
      estado = { estado: "ok" };
    } catch (error) {
      estado = { estado: "error", error: String(error.message || error) };
    }
    if (/^[a-zA-Z0-9_-]{10,100}$/.test(id)) {
      cache.put("rvbAlta_" + id, JSON.stringify(estado), ESTADO_SEGUNDOS);
    }
    return respuestaPOST_();
  }

  return respuestaPOST_();
}

function respuestaPOST_() {
  // La PWA no intenta leer el cuerpo de la respuesta (POST no-cors).
  return ContentService.createTextOutput(JSON.stringify({ recibido: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function validarSolicitud_(solicitudId) {
  if (!/^[a-f0-9-]{36}$/i.test(String(solicitudId || ""))) {
    throw new Error("Solicitud inválida.");
  }
}

function exigirSesion_(token) {
  const t = String(token || "");
  if (!/^RVB_[0-9a-f]{64}$/.test(t)) {
    throw new Error("Sesión de entrenador no válida.");
  }
  const raw = CacheService.getScriptCache().get("sesion_" + t);
  if (!raw) throw new Error("Sesión caducada. Vuelve a iniciar sesión.");
  const sesion = JSON.parse(raw);
  if (!sesion || !sesion.usuario || Number(sesion.exp) <= Date.now()) {
    throw new Error("Sesión caducada. Vuelve a iniciar sesión.");
  }
  return sesion;
}

function autenticarCoach_(usuario, password) {
  const nombre = String(usuario || "").trim().toUpperCase();
  const clave = String(password || "").trim();
  if (!nombre || !clave || clave.length > 200) {
    throw new Error("Credenciales inválidas.");
  }

  // Usa exactamente las columnas del login anterior: A usuario,
  // B contraseña, C rol y D equipo por defecto.
  const hoja = SpreadsheetApp.openById(SS_ID_ALTAS).getSheets()[0];
  const total = hoja.getLastRow() - 1;
  if (total <= 0) throw new Error("No hay usuarios.");
  const filas = hoja.getRange(2, 1, total, 4).getDisplayValues();
  for (const fila of filas) {
    if (String(fila[0] || "").trim().toUpperCase() !== nombre) continue;
    if (String(fila[1] || "").trim() !== clave) break;
    const rol = String(fila[2] || "").trim();
    if (/jugador|atleta|player/i.test(rol)) {
      throw new Error("Este usuario no tiene perfil de entrenador.");
    }
    return {
      usuario: String(fila[0] || "").trim().toUpperCase(),
      rol, equipo: String(fila[3] || "").trim()
    };
  }
  throw new Error("Credenciales incorrectas.");
}

function normalizar_(valor) {
  return String(valor == null ? "" : valor)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().replace(/\s+/g, " ").toUpperCase();
}

function hojaAltas_() {
  const hoja = SpreadsheetApp.openById(SS_ID_ALTAS).getSheetByName(HOJA_ALTAS);
  if (!hoja) throw new Error("No existe la hoja Alta lesiones.");

  // Evitar actualizar otra tabla por error.
  const cab = hoja.getRange(1, 1, 1, 12).getDisplayValues()[0]
    .map(v => normalizar_(v));
  const esperadas = {
    1: "TIMESTAMP", 2: "FECHA", 3: "UBICACION", 4: "USUARIO",
    6: "EQUIPO", 7: "ENTRADA", 8: "GRAVEDAD", 9: "ALTA",
    10: "LESION", 11: "DESCRIPCION", 12: "OBSERVACIONES"
  };
  Object.keys(esperadas).forEach(pos => {
    if (cab[Number(pos) - 1] !== esperadas[pos]) {
      throw new Error("La columna " + pos + " no coincide con la cabecera esperada.");
    }
  });
  return hoja;
}

function firmaRegistro_(datosAD, equipo) {
  // Identidad basada en Timestamp, Fecha, Ubicación, Usuario y Equipo.
  // No se utiliza la columna G (Entrada).
  const texto = [...datosAD, equipo].map(v => String(v || "").trim()).join("\u001f");
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8
  );
  return bytes.map(b => (b & 255).toString(16).padStart(2, "0")).join("");
}

function obtenerPendientes_(equipo) {
  if (!String(equipo || "").trim()) {
    throw new Error("Falta seleccionar el equipo.");
  }
  const hoja = hojaAltas_();
  const n = hoja.getLastRow() - 1;
  if (n <= 0) return [];

  // Lectura discontinua a propósito: NO leer ni tocar la columna G.
  const ad = hoja.getRange(2, 1, n, 4).getDisplayValues(); // A:D
  const equipos = hoja.getRange(2, 6, n, 1).getDisplayValues(); // F
  const datos = hoja.getRange(2, 8, n, 5).getDisplayValues(); // H:L
  const fechas = hoja.getRange(2, 2, n, 1).getValues(); // B, para ordenar

  const resultado = [];
  for (let i = 0; i < n; i++) {
    const filaAD = ad[i];
    const eq = String(equipos[i][0] || "").trim();
    const campos = datos[i];
    const alta = String(campos[1] || "").trim(); // I

    if (normalizar_(eq) !== normalizar_(equipo) || alta !== "") continue;
    if (!String(filaAD[3] || "").trim()) continue;

    const fechaReal = fechas[i][0];
    const orden = fechaReal instanceof Date && !isNaN(fechaReal.getTime())
      ? fechaReal.getTime() : i;

    resultado.push({
      fila: i + 2,
      firma: firmaRegistro_(filaAD, eq),
      fecha: String(filaAD[1] || ""),
      ubicacion: String(filaAD[2] || ""),
      usuario: String(filaAD[3] || ""),
      gravedad: String(campos[0] || ""),      // H
      lesion: String(campos[2] || ""),        // J
      descripcion: String(campos[3] || ""),  // K
      observaciones: String(campos[4] || ""),// L
      _orden: orden
    });
  }

  resultado.sort((a, b) => b._orden - a._orden || b.fila - a.fila);
  return resultado.map(({ _orden, ...r }) => r);
}

function fechaAlta_(texto, zonaHoraria) {
  const fecha = String(texto || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("Fecha de alta inválida.");
  const d = Utilities.parseDate(fecha, zonaHoraria, "yyyy-MM-dd");
  if (Utilities.formatDate(d, zonaHoraria, "yyyy-MM-dd") !== fecha) {
    throw new Error("La fecha de alta no existe en el calendario.");
  }
  return d;
}

function textoCelda_(valor) {
  const texto = String(valor || "").trim();
  // Impide introducir fórmulas accidentales en los campos de texto.
  return /^[=+@]/.test(texto) ? "'" + texto : texto;
}

function guardarAlta_(p) {
  const equipo = String(p.equipo || "").trim();
  if (!equipo) throw new Error("Falta seleccionar el equipo.");
  const fila = Number(p.fila);
  const firma = String(p.firma || "");
  const gravedad = Number(p.gravedad);
  const lesion = textoCelda_(p.lesion);
  const descripcion = textoCelda_(p.descripcion);
  const observaciones = textoCelda_(p.observaciones);

  if (!Number.isSafeInteger(fila) || fila < 2 || !/^[0-9a-f]{64}$/.test(firma)) {
    throw new Error("Identificador de registro inválido.");
  }
  if (!Number.isInteger(gravedad) || gravedad < 1 || gravedad > 5) {
    throw new Error("La gravedad debe estar entre 1 y 5.");
  }
  if (!lesion || !descripcion) {
    throw new Error("Lesión y descripción son obligatorias.");
  }
  if (lesion.length > 201 || descripcion.length > 2001 || observaciones.length > 2001) {
    throw new Error("Se ha superado la longitud máxima de un campo.");
  }

  const libro = SpreadsheetApp.openById(SS_ID_ALTAS);
  const fecha = fechaAlta_(p.alta, libro.getSpreadsheetTimeZone());
  const lock = LockService.getScriptLock();
  lock.waitLock(12000);
  try {
    const hoja = hojaAltas_();
    if (fila > hoja.getLastRow()) throw new Error("La lesión ya no existe. Recarga la lista.");

    // Solo leemos A:D, F e I para verificar el registro. G queda intacta.
    const ad = hoja.getRange(fila, 1, 1, 4).getDisplayValues()[0];
    const equipoFila = hoja.getRange(fila, 6).getDisplayValue();
    const altaActual = hoja.getRange(fila, 9).getDisplayValue().trim();

    if (normalizar_(equipoFila) !== normalizar_(equipo) ||
        firmaRegistro_(ad, equipoFila) !== firma) {
      throw new Error("La lesión ha cambiado o la hoja se ha reordenado. Recarga la lista.");
    }
    if (altaActual) throw new Error("Esta lesión ya tiene fecha de alta.");

    // ÚNICA ESCRITURA: H, I, J, K, L. No tocar G.
    hoja.getRange(fila, 8, 1, 5).setValues([[
      gravedad, fecha, lesion, descripcion, observaciones
    ]]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}
