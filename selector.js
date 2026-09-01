// Quitamos "&num=" para traer toda la tabla
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec?accion=consultar";

const equipoSeleccionado = localStorage.getItem("equipo");

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");

  try {
    const response = await fetch(URL_APPS_SCRIPT);
    const datos = await response.json();

    // 1. Filtrar los jugadores excluyendo PF/Coach y limitando al equipo
    const jugadores = datos.filter(fila => {
      const col3 = (fila.columna3 || "").toString().toLowerCase().trim();
      const col4 = fila.columna4;

      const esStaff = col3 === "pf" || col3 === "coach";
      return !esStaff && col4 === equipoSeleccionado;
    });

    // 2. Renderizar la plantilla dinámicamente
    contenedor.innerHTML = jugadores.map((jugador, index) => `
      <div class="tarjeta-jugador" data-posicion="${index + 1}" data-usuario="${jugador.num}">
        <img src="${jugador.columna10 || 'assets/placeholder.png'}" alt="${jugador.num}" loading="lazy" />
        <span>${jugador.columna9 || jugador.columna6 || jugador.num}</span>
      </div>
    `).join("");

    // 3. Capturar el clic en cualquier tarjeta del contenedor
    contenedor.addEventListener("click", (e) => {
      const tarjeta = e.target.closest(".tarjeta-jugador");
      if (!tarjeta) return;

      const posicion = tarjeta.dataset.posicion;
      const usuarioJugador = tarjeta.dataset.usuario;

      // Guardar selección para usarla en la pantalla siguiente
      localStorage.setItem("posicionSeleccionada", posicion);
      localStorage.setItem("jugadorSeleccionado", usuarioJugador);

      // Redirigir a la siguiente vista
      window.location.href = "detalle.html";
    });

  } catch (error) {
    console.error("Error al consultar Google Apps Script:", error);
  }
});
