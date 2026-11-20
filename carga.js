/* Coach RVB · Carga Equipo; también admite Carga Jugador desde carga.html. */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const modo = localStorage.getItem("Variable") || "Carga Equipo";
  const esJugador = modo === "Carga Jugador";
  $("etiquetaTitulo").textContent = esJugador ? "Carga Jugador" : "Carga Equipo";
  $("grupoTextBox").style.display = esJugador ? "block" : "none";
  $("inputUsuarioCarga").value = localStorage.getItem("User") ||
    localStorage.getItem("jugadorSeleccionado") || "";

  const equipoGuardado = localStorage.getItem("Equipo") || "";
  const selectorEquipo = $("selectorEquipoCarga");
  const opcion = Array.from(selectorEquipo.options).find(
    o => o.value.toUpperCase() === equipoGuardado.toUpperCase()
  );
  if (opcion) selectorEquipo.value = opcion.value;
  $("inputFecha").value = RVBInformes.fechaHoy();

  const boton = $("btnEnviarCarga");
  const mensaje = $("estadoCargaEquipo");
  const panel = $("panelPdfEquipo");
  const iframe = $("vistaPdfEquipo");
  let ocupado = false;

  function ocultarPreview() {
    panel.hidden = true;
    iframe.removeAttribute("src");
    $("contenedorCargaEquipo").classList.remove("vista-abierta");
  }
  selectorEquipo.addEventListener("change", ocultarPreview);
  $("inputFecha").addEventListener("change", ocultarPreview);
  $("inputUsuarioCarga").addEventListener("input", ocultarPreview);

  boton.addEventListener("click", async () => {
    if (ocupado) return;
    const equipo = selectorEquipo.value.trim();
    const jugador = $("inputUsuarioCarga").value.trim();
    if (!equipo || !$("inputFecha").value || (esJugador && !jugador)) {
      mensaje.textContent = "Rellena los campos obligatorios.";
      return;
    }

    let fecha;
    try { fecha = RVBInformes.fechaParaHoja($("inputFecha").value); }
    catch (e) { mensaje.textContent = e.message; return; }

    const parametros = esJugador ? {
      accion: "jugador", textbox1: equipo, textbox2: jugador, textbox3: fecha
    } : {
      accion: "equipo", nuevoValorB9: equipo, nuevoValorB10: fecha
    };
    const tipo = esJugador ? "jugador" : "equipo";

    ocupado = true;
    boton.disabled = true;
    boton.textContent = "Preparando...";
    mensaje.textContent = "Actualizando el informe...";
    ocultarPreview();

    try {
      const respuesta = await RVBInformes.solicitar(parametros);
      if (!respuesta || !respuesta.ok || respuesta.informe !== tipo) {
        throw new Error(respuesta?.error || "Apps Script no confirmó el informe.");
      }
      if (esJugador && (respuesta.numG13 !== equipo ||
          respuesta.numG14 !== jugador || respuesta.numG15 !== fecha)) {
        throw new Error("El servidor confirmó valores distintos a los solicitados.");
      }
      if (!esJugador && (respuesta.numB9 !== equipo || respuesta.numB10 !== fecha)) {
        throw new Error("El servidor confirmó valores distintos a los solicitados.");
      }
      const pdf = RVBInformes.urlPdf(tipo, false);
      $("abrirPdfEquipo").href = pdf;
      $("descargarPdfEquipo").href = RVBInformes.urlPdf(tipo, true);
      panel.hidden = false;
      $("contenedorCargaEquipo").classList.add("vista-abierta");
      mensaje.textContent = "Informe actualizado. Puedes visualizarlo o descargarlo.";
      await new Promise(resolve => setTimeout(resolve, 700));
      iframe.src = pdf;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Carga Equipo:", error);
      mensaje.textContent = error.message || "No se pudo preparar el informe.";
    } finally {
      ocupado = false;
      boton.disabled = false;
      boton.textContent = "Ver informe";
    }
  });

  $("btnVolverMenu").addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });
});
