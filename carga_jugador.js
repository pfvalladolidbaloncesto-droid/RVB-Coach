/* Coach RVB · Carga Jugador - vista previa PDF y descarga manual. */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const equipo = String(localStorage.getItem("Equipo") || "").trim();
  const jugador = String(localStorage.getItem("User") ||
    localStorage.getItem("jugadorSeleccionado") || "").trim();

  $("inputEquipo").value = equipo;
  $("inputJugador").value = jugador;
  $("inputFecha").value = RVBInformes.fechaHoy();

  const boton = $("btnEnviarCargaJugador");
  const mensaje = $("estadoCargaJugador");
  const preview = $("vistaPdfJugador");
  const panel = $("panelPdfJugador");
  const abrir = $("abrirPdfJugador");
  const descargar = $("descargarPdfJugador");
  let ocupado = false;

  function ocultarPreview() {
    panel.hidden = true;
    preview.removeAttribute("src");
    $("contenedorCargaJugador").classList.remove("vista-abierta");
  }

  $("inputFecha").addEventListener("change", ocultarPreview);

  boton.addEventListener("click", async () => {
    if (ocupado) return;
    const fechaISO = $("inputFecha").value;
    if (!equipo || !jugador || !fechaISO) {
      mensaje.textContent = "Faltan equipo, jugador o fecha.";
      return;
    }

    let fecha;
    try { fecha = RVBInformes.fechaParaHoja(fechaISO); }
    catch (e) { mensaje.textContent = e.message; return; }

    ocupado = true;
    boton.disabled = true;
    boton.textContent = "Preparando...";
    mensaje.textContent = "Actualizando el informe de jugador...";
    ocultarPreview();

    try {
      const resultado = await RVBInformes.solicitar({
        accion: "jugador", textbox1: equipo,
        textbox2: jugador, textbox3: fecha
      });
      if (!resultado || !resultado.ok || resultado.informe !== "jugador") {
        throw new Error(resultado?.error ||
          "Apps Script no confirmó la actualización del informe.");
      }
      if (resultado.numG13 !== equipo ||
          resultado.numG14 !== jugador || resultado.numG15 !== fecha) {
        throw new Error("Los valores confirmados por el servidor no coinciden.");
      }

      const urlVista = RVBInformes.urlPdf("jugador", false);
      const urlDescarga = RVBInformes.urlPdf("jugador", true);
      abrir.href = urlVista;
      descargar.href = urlDescarga;
      panel.hidden = false;
      $("contenedorCargaJugador").classList.add("vista-abierta");
      mensaje.textContent = "Informe actualizado. Puedes verlo abajo o abrirlo en otra pestaña.";
      // Permitir el recálculo de fórmulas antes de consultar el PDF.
      await new Promise(resolve => setTimeout(resolve, 700));
      preview.src = urlVista;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Carga Jugador:", error);
      mensaje.textContent = error.message || "No se pudo preparar el informe.";
    } finally {
      ocupado = false;
      boton.disabled = false;
      boton.textContent = "Ver informe";
    }
  });

  $("btnVolverSelector").addEventListener("click", () => {
    window.location.href = "selector.html";
  });
});
