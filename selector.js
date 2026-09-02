const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjNjsoJvliC8sZPLhLYUS9pcJ19d5uu49szu7RjnPBBMmAM6ZgD515hNhHulAxbsMCwQ/exec";

// 1. Obtener el equipo guardado en localStorage
const equipoSeleccionado = localStorage.getItem("equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");
  const tituloEquipo = document.getElementById("nombre-equipo");

  if (tituloEquipo) tituloEquipo.textContent = equipoSeleccionado;

  try {
    // 2. Fetch al endpoint pasando el equipo como parámetro
    const response = await fetch(`${URL_APPS_SCRIPT}?equipo=${encodeURIComponent(equipoSeleccionado)}`);
    const jugadores = await response.json();

    if (!jugadores || jugadores.length === 0) {
      contenedor.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay jugadores para <b>${equipoSeleccionado}</b></p>`;
      return;
    }

    // 3. Crear mapa de jugadores asignados a cada posición (Columna K)
    const mapaJugadores = {};
    jugadores.forEach(j => {
      const pos = parseInt(j.posicion, 10);
      if (!isNaN(pos)) {
        mapaJugadores[pos] = j.usuario;
      }
    });

    // 4. Renderizar exactamente 16 celdas
    let htmlGrid = "";
    for (let i = 1; i <= 16; i++) {
      const idUsuario = mapaJugadores[i];

      if (idUsuario) {
        // Celda ocupada por jugador
        const rutaFoto = `fotos/${idUsuario}.jpg`;
        htmlGrid += `
          <div class="tarjeta-jugador" data-posicion="${i}" data-usuario="${idUsuario}">
            <img src="${rutaFoto}" alt="${idUsuario}" onerror="this.src='fotos/default.jpg'" loading="lazy" />
            <span>${idUsuario}</span>
          </div>
        `;
      } else {
        // Celda vacía en la cuadrícula
        htmlGrid += `
          <div class="celda-grid celda-vacia" data-posicion="${i}">
            <span style="color: #ccc;">${i}</span>
          </div>
        `;
      }
    }

    contenedor.innerHTML = htmlGrid;

    // 5. Capturar selección al hacer clic en un jugador
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
      contenedor.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>Error de conexión con la base de datos.</p>";
    }
  }
});
