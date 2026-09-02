document.addEventListener("DOMContentLoaded", () => {
  const labelID = document.getElementById("labelID");
  const btnVolver = document.getElementById("btnVolver");
  const btnEnviar = document.getElementById("btnEnviar");
  const btnMenuPrincipal = document.getElementById("btnMenuPrincipal");

  // Elementos de sliders y sus etiquetas de valor
  const sliderSoreness = document.getElementById("deslizadorSoreness");
  const respuestaSoreness = document.getElementById("respuestaSoreness");
  
  const sliderFatiga = document.getElementById("deslizadorFatiga");
  const respuestaFatiga = document.getElementById("respuestaFatiga");

  const sliderSueno = document.getElementById("deslizadorSueno");
  const respuestaSueno = document.getElementById("respuestaSueno");

  const sliderEstres = document.getElementById("deslizadorEstres");
  const respuestaEstres = document.getElementById("respuestaEstres");

  // Lectura normalizada de LocalStorage usando las claves correctas
  const jugadorSeleccionado = localStorage.getItem("User") || localStorage.getItem("jugadorSeleccionado") || "Jugador";
  const equipoSeleccionado = localStorage.getItem("Equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

  if (labelID) {
    labelID.textContent = `${jugadorSeleccionado}`;
  }

  // Sincronizar cambios en los sliders en tiempo real
  if (sliderSoreness) sliderSoreness.addEventListener("input", (e) => { respuestaSoreness.textContent = e.target.value; });
  if (sliderFatiga) sliderFatiga.addEventListener("input", (e) => { respuestaFatiga.textContent = e.target.value; });
  if (sliderSueno) sliderSueno.addEventListener("input", (e) => { respuestaSueno.textContent = e.target.value; });
  if (sliderEstres) sliderEstres.addEventListener("input", (e) => { respuestaEstres.textContent = e.target.value; });

  // Botón Volver al selector
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      window.location.href = "selector.html";
    });
  }

  // Botón Menú Principal
  if (btnMenuPrincipal) {
    btnMenuPrincipal.addEventListener("click", () => {
      window.location.href = "menu_principal.html";
    });
  }

  // Envío de datos de Readiness
  if (btnEnviar) {
    btnEnviar.addEventListener("click", async () => {
      const fecha = new Date().toISOString().split('T')[0];

      // URL de tu formulario/script de Google para Readiness (ajusta los entry.X si procede)
      const baseUrl = "https://docs.google.com/forms/d/e/TU_FORM_ID/formResponse";
      
      const params = new URLSearchParams({
        "entry.FECHA": fecha,
        "entry.USUARIO": jugadorSeleccionado,
        "entry.EQUIPO": equipoSeleccionado,
        "entry.SORENESS": sliderSoreness.value,
        "entry.FATIGA": sliderFatiga.value,
        "entry.SUENO": sliderSueno.value,
        "entry.ESTRES": sliderEstres.value
      });

      try {
        await fetch(`${baseUrl}?${params.toString()}`, { method: 'POST', mode: 'no-cors' });
        alert("Readiness registrado con éxito");
        window.location.href = "selector.html";
      } catch (error) {
        alert("Error al enviar los datos: " + error);
      }
    });
  }
});
