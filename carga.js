
/* Coach RVB · Carga Equipo y Carga Jugador */

document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  const modo = localStorage.getItem("Variable") || "Carga Equipo";
  const esJugador = modo === "Carga Jugador";

  $("etiquetaTitulo").textContent =
    esJugador ? "Carga Jugador" : "Carga Equipo";

  $("grupoTextBox").style.display =
    esJugador ? "block" : "none";

  // SELECTOR DE ÚLTIMOS DÍAS
  // Solo visible en Carga Equipo.

  const selectorUltimosDias = $("selectorUltimosDias");

  $("grupoUltimosDias").hidden = esJugador;

  selectorUltimosDias.value = "";

  // RECUPERAR JUGADOR

  $("inputUsuarioCarga").value =
    localStorage.getItem("User") ||
    localStorage.getItem("jugadorSeleccionado") ||
    "";

  // RECUPERAR EQUIPO

  const equipoGuardado =
    localStorage.getItem("Equipo") || "";

  const selectorEquipo = $("selectorEquipoCarga");

  const opcion = Array.from(selectorEquipo.options).find(
    o => o.value.toUpperCase() === equipoGuardado.toUpperCase()
  );

  if (opcion) {
    selectorEquipo.value = opcion.value;
  }

  // FECHA PREDETERMINADA

  $("inputFecha").value = RVBInformes.fechaHoy();

  const boton = $("btnEnviarCarga");
  const mensaje = $("estadoCargaEquipo");
  const panel = $("panelPdfEquipo");
  const iframe = $("vistaPdfEquipo");

  let ocupado = false;
  let urlPdfLocal = null;

  // LIMPIAR PDF ANTERIOR

  function limpiarUrlPdf() {
    if (urlPdfLocal) {
      URL.revokeObjectURL(urlPdfLocal);
      urlPdfLocal = null;
    }
  }

  function ocultarPreview() {

    panel.hidden = true;

    iframe.removeAttribute("src");

    $("abrirPdfEquipo").removeAttribute("href");
    $("descargarPdfEquipo").removeAttribute("href");

    limpiarUrlPdf();

    $("contenedorCargaEquipo")
      .classList.remove("vista-abierta");
  }

  selectorEquipo.addEventListener(
    "change",
    ocultarPreview
  );

  $("inputFecha").addEventListener(
    "change",
    ocultarPreview
  );

  $("inputUsuarioCarga").addEventListener(
    "input",
    ocultarPreview
  );

  selectorUltimosDias.addEventListener(
    "change",
    ocultarPreview
  );

  // GENERAR INFORME

  boton.addEventListener("click", async () => {

    if (ocupado) return;

    const equipo = selectorEquipo.value.trim();

    const jugador =
      $("inputUsuarioCarga").value.trim();

    const ultimosDias =
      selectorUltimosDias.value;

    if (
      !equipo ||
      !$("inputFecha").value ||
      (esJugador && !jugador)
    ) {
      mensaje.textContent =
        "Rellena los campos obligatorios.";
      return;
    }

    // VALIDAR OPCIÓN DE DÍAS

    if (
      !esJugador &&
      !["", "7", "14", "21", "28"].includes(ultimosDias)
    ) {
      mensaje.textContent =
        "Selecciona un periodo válido.";
      return;
    }

    let fecha;

    try {
      fecha = RVBInformes.fechaParaHoja(
        $("inputFecha").value
      );

    } catch (e) {

      mensaje.textContent = e.message;
      return;
    }

    // PARÁMETROS ENVIADOS A APPS SCRIPT

    const parametros = esJugador ? {

      accion: "jugador",
      textbox1: equipo,
      textbox2: jugador,
      textbox3: fecha

    } : {

      accion: "pdfEquipo",
      nuevoValorB9: equipo,
      nuevoValorB10: fecha,

      // NUEVO PARÁMETRO
      nuevoValorB11: ultimosDias

    };

    const tipo = esJugador ? "jugador" : "equipo";

    ocupado = true;

    boton.disabled = true;
    selectorEquipo.disabled = true;
    selectorUltimosDias.disabled = true;
    $("inputFecha").disabled = true;
    $("inputUsuarioCarga").disabled = true;

    boton.textContent = "Preparando...";

    mensaje.textContent =
      "Actualizando el informe...";

    ocultarPreview();

    try {

      const respuesta =
        await RVBInformes.solicitar(parametros);

      if (
        !respuesta ||
        !respuesta.ok ||
        respuesta.informe !== tipo
      ) {
        throw new Error(
          respuesta?.error ||
          "Apps Script no confirmó el informe."
        );
      }

      // COMPROBAR INFORME INDIVIDUAL

      if (
        esJugador &&
        (
          respuesta.numG13 !== equipo ||
          respuesta.numG14 !== jugador ||
          respuesta.numG15 !== fecha
        )
      ) {
        throw new Error(
          "El servidor confirmó valores distintos a los solicitados."
        );
      }

      // COMPROBAR INFORME COLECTIVO

      if (
        !esJugador &&
        (
          respuesta.numB9 !== equipo ||
          respuesta.numB10 !== fecha ||
          respuesta.numB11 === undefined ||
          String(respuesta.numB11) !== ultimosDias
        )
      ) {
        throw new Error(
          "El servidor no confirmó correctamente el equipo, la fecha o los últimos días."
        );
      }

      if (esJugador) {

        // INFORME INDIVIDUAL

        const pdf =
          RVBInformes.urlPdf("jugador", false);

        $("abrirPdfEquipo").href = pdf;

        $("descargarPdfEquipo").href =
          RVBInformes.urlPdf("jugador", true);

        $("descargarPdfEquipo")
          .removeAttribute("download");

        iframe.src = pdf;

        mensaje.textContent =
          "Informe de jugador actualizado.";

      } else {

        // INFORME COLECTIVO

        const blob =
          RVBInformes.convertirBase64Pdf(
            respuesta.pdfBase64
          );

        urlPdfLocal = URL.createObjectURL(blob);

        $("abrirPdfEquipo").href = urlPdfLocal;

        $("descargarPdfEquipo").href = urlPdfLocal;

        $("descargarPdfEquipo").setAttribute(
          "download",
          respuesta.archivo || "Informe_equipo.pdf"
        );

        iframe.src = urlPdfLocal;

        const periodo = ultimosDias
          ? "Últimos " + ultimosDias + " días. "
          : "";

        mensaje.textContent =
          periodo +
          "PDF del equipo generado correctamente (" +
          Math.round(blob.size / 1024) +
          " KB). Puedes verlo o descargarlo.";
      }

      panel.hidden = false;
      iframe.hidden = false;

      $("contenedorCargaEquipo")
        .classList.add("vista-abierta");

      panel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {

      console.error("Carga:", error);

      mensaje.textContent =
        error.message ||
        "No se pudo preparar el informe.";

    } finally {

      ocupado = false;

      boton.disabled = false;
      selectorEquipo.disabled = false;
      selectorUltimosDias.disabled = false;
      $("inputFecha").disabled = false;
      $("inputUsuarioCarga").disabled = false;

      boton.textContent = "Ver informe";
    }
  });

  window.addEventListener(
    "pagehide",
    limpiarUrlPdf
  );

  $("btnVolverMenu").addEventListener("click", () => {

    if (!ocupado) {
      window.location.href = "menu_principal.html";
    }
  });

});
