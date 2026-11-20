/*
 * Coach RVB · Carga Jugador (versión autónoma 30)
 * - No depende de informes_api.js ni afecta a Carga Equipo.
 * - Consulta accion=pdfJugador por JSONP al Apps Script existente.
 * - G13 equipo, G14 jugador, G15 fecha; exportación E1:S110 en el servidor.
 * - Muestra PDF generado; abrir y descargar son acciones opcionales.
 */
(function () {
  "use strict";

  const URL_APPS_SCRIPT =
    "https://script.google.com/macros/s/AKfycbwXRzLttUWIv82OeF1OI2UU06EADWvwBtcFKbck-fkdXesMKLTZUHbhrT9sP_40HhMexA/exec";

  let numeroPeticion = 0;
  let pdfURL = null;
  let enviando = false;

  function $(id) { return document.getElementById(id); }

  function fechaHoy() {
    const d = new Date();
    const dos = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())}`;
  }

  function fechaParaHoja(iso) {
    // El input type=date permite seleccionar fechas pasadas y futuras.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) throw new Error("Selecciona una fecha en el calendario.");
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  function solicitarPdfJugador(parametros) {
    return new Promise((resolve, reject) => {
      const callback = `rvbPdfJugador_${Date.now()}_${++numeroPeticion}`;
      const script = document.createElement("script");
      const url = new URL(URL_APPS_SCRIPT);
      let terminado = false;
      let temporizador = null;

      function finalizar(error, respuesta) {
        if (terminado) return;
        terminado = true;
        clearTimeout(temporizador);
        script.remove();
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
        if (error) reject(error);
        else resolve(respuesta);
      }

      window[callback] = respuesta => finalizar(null, respuesta);
      script.onerror = () => finalizar(new Error(
        "No se pudo conectar con Apps Script. Revisa la implementación /exec y los permisos."
      ));
      script.onload = () => {
        if (!terminado) finalizar(new Error(
          "Apps Script no devolvió JSONP. Comprueba que code.gs tiene " +
          "la acción pdfJugador y responderRVB_ admite callback."
        ));
      };

      Object.entries(parametros).forEach(([k,v]) => url.searchParams.set(k,String(v)));
      url.searchParams.set("callback", callback);
      url.searchParams.set("_", Date.now().toString());
      script.crossOrigin = "anonymous";
      script.src = url.toString();

      // La generación de PDF tarda más que una consulta ordinaria.
      temporizador = setTimeout(() => finalizar(new Error(
        "No ha llegado la respuesta del PDF en 90 segundos. " +
        "Comprueba en Apps Script > Ejecuciones si apareció un error."
      )), 90000);
      document.head.appendChild(script);
    });
  }

  function base64ABlobPDF(base64) {
    if (typeof base64 !== "string" || !base64) {
      throw new Error("Apps Script no ha devuelto el PDF (pdfBase64 vacío).");
    }
    const binario = atob(base64);
    if (!binario.startsWith("%PDF")) {
      throw new Error("La respuesta recibida no tiene formato PDF.");
    }
    const bloques = [];
    for (let i = 0; i < binario.length; i += 8192) {
      const bloque = binario.slice(i, i + 8192);
      const bytes = new Uint8Array(bloque.length);
      for (let j = 0; j < bloque.length; j++) bytes[j] = bloque.charCodeAt(j);
      bloques.push(bytes);
    }
    return new Blob(bloques, { type: "application/pdf" });
  }

  function iniciar() {
    const ids = ["btnEnviarCargaJugador", "estadoCargaJugador", "panelPdfJugador",
      "vistaPdfJugador", "abrirPdfJugador", "descargarPdfJugador",
      "contenedorCargaJugador", "inputEquipo", "inputJugador", "inputFecha",
      "btnVolverSelector"];
    const falta = ids.find(id => !$(id));
    if (falta) {
      console.error("Carga Jugador: falta un elemento HTML:", falta);
      const estado = $("estadoCargaJugador");
      if (estado) estado.textContent = `Error de página: falta el elemento ${falta}.`;
      return;
    }

    const boton = $("btnEnviarCargaJugador");
    const estado = $("estadoCargaJugador");
    const panel = $("panelPdfJugador");
    const iframe = $("vistaPdfJugador");
    const abrir = $("abrirPdfJugador");
    const descargar = $("descargarPdfJugador");

    const equipo = String(localStorage.getItem("Equipo") || "").trim();
    const jugador = String(
      localStorage.getItem("User") ||
      localStorage.getItem("jugadorSeleccionado") || ""
    ).trim();

    $("inputEquipo").value = equipo;
    $("inputJugador").value = jugador;
    $("inputFecha").value = fechaHoy();

    function mensaje(texto, tipo = "") {
      estado.textContent = texto;
      estado.className = `estado-informe ${tipo}`.trim();
    }

    function limpiarPDF() {
      iframe.removeAttribute("src");
      abrir.removeAttribute("href");
      descargar.removeAttribute("href");
      descargar.removeAttribute("download");
      panel.hidden = true;
      $("contenedorCargaJugador").classList.remove("vista-abierta");
      if (pdfURL) {
        URL.revokeObjectURL(pdfURL);
        pdfURL = null;
      }
    }

    // Este mensaje permite saber si el JS nuevo realmente se ha cargado.
    mensaje(equipo && jugador
      ? "Carga Jugador preparada. Pulsa «Ver informe». (v30)"
      : "Falta el equipo o el jugador. Vuelve al menú y selecciónalos.",
      equipo && jugador ? "" : "error");

    $("inputFecha").addEventListener("change", () => {
      limpiarPDF();
      mensaje("Fecha modificada. Pulsa «Ver informe». (v30)");
    });

    boton.addEventListener("click", async () => {
      // Mensaje INMEDIATO, antes de llamar a Google.
      mensaje("Botón detectado. Preparando solicitud...");
      if (enviando) return;

      const fechaISO = $("inputFecha").value;
      if (!equipo || !jugador || !fechaISO) {
        mensaje("Faltan equipo, jugador o fecha.", "error");
        return;
      }

      let fecha;
      try { fecha = fechaParaHoja(fechaISO); }
      catch (error) { mensaje(error.message, "error"); return; }

      enviando = true;
      boton.disabled = true;
      boton.textContent = "Generando PDF...";
      limpiarPDF();
      mensaje("Actualizando G13, G14 y G15; generando el PDF E1:S110...");

      try {
        const r = await solicitarPdfJugador({
          accion: "pdfJugador",
          textbox1: equipo,
          textbox2: jugador,
          textbox3: fecha
        });

        if (!r || !r.ok || r.informe !== "jugador") {
          throw new Error(r && r.error
            ? r.error
            : "El Apps Script no ha generado el informe de jugador. " +
              "Comprueba si publicaste la última versión de code.gs.");
        }

        if (r.numG13 !== equipo || r.numG14 !== jugador || r.numG15 !== fecha) {
          throw new Error("El servidor devolvió equipo, jugador o fecha distintos.");
        }

        const archivoPDF = base64ABlobPDF(r.pdfBase64);
        pdfURL = URL.createObjectURL(archivoPDF);
        abrir.href = pdfURL;
        descargar.href = pdfURL;
        descargar.download = r.archivo || "Informe_jugador.pdf";
        iframe.src = pdfURL;
        panel.hidden = false;
        $("contenedorCargaJugador").classList.add("vista-abierta");

        mensaje(`PDF generado correctamente (${Math.round(archivoPDF.size/1024)} KB). ` +
          "Puedes abrirlo o descargarlo.", "exito");
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        console.error("Carga Jugador:", error);
        mensaje(error.message || "Error desconocido al generar el PDF.", "error");
      } finally {
        enviando = false;
        boton.disabled = false;
        boton.textContent = "Ver informe";
      }
    });

    $("btnVolverSelector").addEventListener("click", () => {
      location.href = "selector.html";
    });
    window.addEventListener("pagehide", () => {
      if (pdfURL) URL.revokeObjectURL(pdfURL);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();
