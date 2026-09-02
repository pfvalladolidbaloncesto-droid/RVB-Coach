document.addEventListener("DOMContentLoaded", () => {
  const inputEquipo = document.getElementById("inputEquipo");
  const inputJugador = document.getElementById("inputJugador");
  const inputFecha = document.getElementById("inputFecha");
  const btnEnviar = document.getElementById("btnEnviarCargaJugador");
  const btnVolver = document.getElementById("btnVolverSelector");

  // 1. Recuperar los datos guardados desde el selector y menú principal
  const equipoActual = localStorage.getItem("Equipo") || "";
  const usuarioActual = localStorage.getItem("User") || localStorage.getItem("jugadorSeleccionado") || "";

  // Mostrar los valores en los campos correspondientes
  inputEquipo.value = equipoActual;
  inputJugador.value = usuarioActual;

  // 2. Configurar la fecha actual por defecto (YYYY-MM-DD)
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  inputFecha.value = `${year}-${month}-${day}`;

  // 3. Lógica del Botón Enviar
  btnEnviar.addEventListener("click", async () => {
    const fechaSeleccionada = inputFecha.value;

    if (!equipoActual || !usuarioActual || !fechaSeleccionada) {
      alert("Faltan datos obligatorios (Equipo, Jugador o Fecha).");
      return;
    }

    // Convertir la fecha a formato DD/MM/YYYY para que coincida con tu Apps Script original
    const partesFecha = fechaSeleccionada.split("-");
    const fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;

    // URL de Apps Script específica para "Carga Jugador" extraída de tus bloques originales
    const urlWeb = `https://script.google.com/macros/s/AKfycbwXRzLttUWIv82OeF1OI2UU06EADWvwBtcFKbck-fkdXesMKLTZUHbhrT9sP_40HhMexA/exec?textbox1=${encodeURIComponent(equipoActual)}&textbox2=${encodeURIComponent(usuarioActual)}&textbox3=${encodeURIComponent(fechaFormateada)}`;

    try {
      btnEnviar.textContent = "Enviando...";
      btnEnviar.disabled = true;

      // Realizar la petición GET al servidor (equivalente a Web1.Get en App Inventor)
      await fetch(urlWeb);

      // Enlace del PDF específico para "Carga Jugador" extraído de tus bloques originales
      const urlPdf = "https://docs.google.com/spreadsheets/d/1waAXuyLOYY7yp0WQzv17OTOPvcZ4uvuhKGkp1YdlOrQ/export?format=pdf&gid=1857963185&range=E1:S110&size=A4&portrait=true&fitw=true&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5";

      // Abrir el PDF generado en una pestaña nueva
      window.open(urlPdf, "_blank");

    } catch (error) {
      console.error("Error al enviar los datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      btnEnviar.textContent = "Enviar";
      btnEnviar.disabled = false;
    }
  });

  // Botón para regresar al selector de jugadores
  btnVolver.addEventListener("click", () => {
    window.location.href = "selector.html";
  });
});
