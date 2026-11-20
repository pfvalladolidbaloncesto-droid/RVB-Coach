/* Coach RVB · Carga Jugador (mismo flujo de App Inventor).
 * Actualiza G13, G14, G15 y abre directamente el PDF original de PP().
 * No crea un PDF nuevo ni utiliza iframe o URL /export.
 */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const equipo = String(localStorage.getItem("Equipo") || "").trim();
  const jugador = String(localStorage.getItem("User") ||
    localStorage.getItem("jugadorSeleccionado") || "").trim();
  $("inputEquipo").value = equipo;
  $("inputJugador").value = jugador;
  $("inputFecha").value = RVBInformes.fechaHoy();

  const boton = $("btnEnviarCargaJugador");
  const estado = $("estadoCargaJugador");
  const panel = $("panelEnlaceJugador");
  const enlace = $("enlacePdfJugadorManual");
  let trabajando = false;

  $("inputFecha").addEventListener("change", () => {
    panel.hidden = true;
    enlace.removeAttribute("href");
    estado.textContent = "";
  });

  boton.addEventListener("click", async () => {
    if (trabajando) return;
    if (!equipo || !jugador || !$("inputFecha").value) {
      estado.textContent = "Faltan equipo, jugador o fecha.";
      return;
    }
    // El calendario HTML ya proporciona una fecha real en formato AAAA-MM-DD.
    // No imponemos ninguna restriccion temporal ni usamos la validacion
    // adicional de informes_api.js: se admiten fechas pasadas y futuras.
    const fechaISO = $("inputFecha").value;
    const [anio, mes, dia] = fechaISO.split("-");
    const fecha = `${dia}/${mes}/${anio}`;

    const ventana = RVBInformes.prepararVentanaInforme();
    trabajando = true;
    boton.disabled = true;
    boton.textContent = "Preparando...";
    estado.textContent = "Actualizando Informe jugadores...";
    panel.hidden = true;

    try {
      const respuesta = await RVBInformes.solicitar({
        accion: "jugador", textbox1: equipo, textbox2: jugador, textbox3: fecha
      });
      if (!respuesta || !respuesta.ok || respuesta.informe !== "jugador") {
        throw new Error(respuesta?.error || "Apps Script no confirmó la actualización.");
      }
      if (respuesta.numG13 !== equipo || respuesta.numG14 !== jugador ||
          respuesta.numG15 !== fecha) {
        throw new Error("La hoja no ha confirmado los datos del jugador.");
      }

      await new Promise(resolver => setTimeout(resolver, 700));
      enlace.href = RVBInformes.urlPdf("jugador");
      panel.hidden = false;
      const abierta = RVBInformes.abrirInforme(ventana, "jugador");
      estado.textContent = abierta
        ? "Informe actualizado. Se ha abierto el PDF en el navegador; puedes descargarlo desde su visor."
        : "Informe actualizado. Pulsa «Abrir PDF» para verlo en el navegador.";
    } catch (error) {
      RVBInformes.cerrarVentanaInforme(ventana);
      console.error("Carga Jugador:", error);
      estado.textContent = error.message || "Error al preparar el informe.";
    } finally {
      trabajando = false;
      boton.disabled = false;
      boton.textContent = "Ver informe";
    }
  });

  $("btnVolverSelector").addEventListener("click", () => {
    window.location.href = "selector.html";
  });
});
