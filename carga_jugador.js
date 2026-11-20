/*
 * Coach RVB · Carga Jugador
 * Escribe G13/G14/G15 y recibe un PDF REAL generado por Apps Script.
 * Hoja Informe jugadores, rango E1:S110. Sin fechas restringidas.
 * Reutiliza informes_api.js ya instalado y funcionando para Carga Equipo.
 */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const equipo = String(localStorage.getItem("Equipo") || "").trim();
  const jugador = String(
    localStorage.getItem("User") ||
    localStorage.getItem("jugadorSeleccionado") || ""
  ).trim();

  const boton = $("btnEnviarCargaJugador");
  const estado = $("estadoCargaJugador");
  const panel = $("panelPdfJugador");
  const iframe = $("vistaPdfJugador");
  const abrir = $("abrirPdfJugador");
  const descargar = $("descargarPdfJugador");

  let ocupado = false;
  let urlPdfLocal = null;

  $("inputEquipo").value = equipo;
  $("inputJugador").value = jugador;

  // El calendario admite cualquier fecha pasada o futura.
  if (window.RVBInformes && typeof RVBInformes.fechaHoy === "function") {
    $("inputFecha").value = RVBInformes.fechaHoy();
  } else {
    const hoy = new Date();
    const dos = n => String(n).padStart(2, "0");
    $("inputFecha").value = `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
  }

  function limpiarPdf() {
    iframe.removeAttribute("src");
    abrir.removeAttribute("href");
    descargar.removeAttribute("href");
    descargar.removeAttribute("download");
    if (urlPdfLocal) {
      URL.revokeObjectURL(urlPdfLocal);
      urlPdfLocal = null;
    }
    panel.hidden = true;
    $("contenedorCargaJugador").classList.remove("vista-abierta");
  }

  $("inputFecha").addEventListener("change", () => {
    limpiarPdf();
    estado.textContent = "";
  });

  boton.addEventListener("click", async () => {
    if (ocupado) return;

    const fechaISO = $("inputFecha").value;
    if (!equipo || !jugador || !fechaISO) {
      estado.textContent = "Faltan equipo, jugador o fecha.";
      return;
    }
    if (!window.RVBInformes ||
        typeof RVBInformes.solicitar !== "function" ||
        typeof RVBInformes.convertirBase64Pdf !== "function") {
      estado.textContent = "La comunicación con Apps Script no está actualizada. Recarga la página.";
      return;
    }

    // El input date entrega YYYY-MM-DD; se convierte para la hoja.
    const partes = fechaISO.split("-");
    if (partes.length !== 3) {
      estado.textContent = "Selecciona una fecha desde el calendario.";
      return;
    }
    const fecha = `${partes[2]}/${partes[1]}/${partes[0]}`;

    ocupado = true;
    boton.disabled = true;
    boton.textContent = "Generando PDF...";
    estado.textContent = "Actualizando Informe jugadores y generando el PDF...";
    limpiarPdf();

    try {
      const resultado = await RVBInformes.solicitar({
        accion: "pdfJugador",
        textbox1: equipo,
        textbox2: jugador,
        textbox3: fecha
      });

      if (!resultado || !resultado.ok || resultado.informe !== "jugador") {
        throw new Error(resultado?.error ||
          "Apps Script no pudo generar el PDF del jugador.");
      }
      if (resultado.numG13 !== equipo ||
          resultado.numG14 !== jugador ||
          resultado.numG15 !== fecha) {
        throw new Error("El servidor no ha confirmado el equipo, jugador y fecha.");
      }

      const pdf = RVBInformes.convertirBase64Pdf(resultado.pdfBase64);
      urlPdfLocal = URL.createObjectURL(pdf);

      abrir.href = urlPdfLocal;
      descargar.href = urlPdfLocal;
      descargar.download = resultado.archivo || "Informe_jugador.pdf";
      iframe.src = urlPdfLocal;
      panel.hidden = false;
      $("contenedorCargaJugador").classList.add("vista-abierta");

      estado.textContent = "PDF del jugador generado correctamente (" +
        Math.round(pdf.size / 1024) + " KB). Puedes verlo o descargarlo.";
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Carga Jugador:", error);
      estado.textContent = error.message || "No se ha podido generar el informe.";
    } finally {
      ocupado = false;
      boton.disabled = false;
      boton.textContent = "Ver informe";
    }
  });

  $("btnVolverSelector").addEventListener("click", () => {
    window.location.href = "selector.html";
  });

  window.addEventListener("pagehide", () => {
    if (urlPdfLocal) URL.revokeObjectURL(urlPdfLocal);
  });
});
