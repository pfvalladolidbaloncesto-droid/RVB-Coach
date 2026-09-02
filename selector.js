const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjNjsoJvliC8sZPLhLYUS9pcJ19d5uu49szu7RjnPBBMmAM6ZgD515hNhHulAxbsMCwQ/exec";

const equipoSeleccionado = localStorage.getItem("equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");
  const tituloEquipo = document.getElementById("nombre-equipo");
  const btnVolver = document.getElementById("btn-volver");

  if (tituloEquipo) tituloEquipo.textContent = equipoSeleccionado;
  if (btnVolver) btnVolver.onclick = () => { window.location.href = "menu_principal.html"; };

  try {
    const response = await fetch(`${URL_APPS_SCRIPT}?equipo=${encodeURIComponent(equipoSeleccionado)}`);
    const jugadores = await response.json();

    if (!jugadores || jugadores.length === 0) {
      contenedor.innerHTML = `<p class="cargando-texto">No hay jugadores para <b>${equipoSeleccionado}</b></p>`;
      return;
    }

    // Mapa de posiciones 1-16
    const mapaJugadores = {};
    jugadores.forEach(j => {
      const pos = parseInt(j.posicion, 10);
      if (!isNaN(pos)) {
        mapaJugadores[pos] = j.usuario;
      }
    });

    // Renderizar exactamente 16 celdas manteniendo la estructura de clase .celda-grid
    let htmlGrid = "";
    for (let i = 1; i <= 16; i++) {
      const idUsuario = mapaJugadores[i];

      if (idUsuario) {
        const rutaFoto = `fotos/${idUsuario}.jpg`;
        htmlGrid += `
          <div class="celda-grid tarjeta-jugador" data-posicion="${i}" data-usuario="${idUsuario}">
            <img src="${rutaFoto}" alt="${idUsuario}" onerror="this.src='fotos/default.jpg'" loading="lazy" />
            <span>${idUsuario}</span>
          </div>
        `;
      } else {
        htmlGrid += `
          <div class="celda-grid celda-vacia" data-posicion="${i}">
            <span style="color: #ccc;">${i}</span>
          </div>
        `;
      }
    }

    contenedor.innerHTML = htmlGrid;

    // Guardar selección al hacer clic
    contenedor.addEventListener("click", (e) => {
      const tarjeta = e.target.closest(".tarjeta-jugador");
      if (!tarjeta) return;

      localStorage.setItem("posicionSeleccionada", tarjeta.dataset.posicion);
      localStorage.setItem("jugadorSeleccionado", tarjeta.dataset.usuario);

      window.location.href = "detalle.html";
    });

  } catch (error) {
    console.error("Error al cargar la plantilla:", error);
    if (contenedor) {
      contenedor.innerHTML = "<p class='cargando-texto' style='color:red;'>Error de conexión con la base de datos.</p>";
    }
  }
});
