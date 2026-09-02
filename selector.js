const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjNjsoJvliC8sZPLhLYUS9pcJ19d5uu49szu7RjnPBBMmAM6ZgD515hNhHulAxbsMCwQ/exec";

// 1. Obtener el equipo guardado en localStorage
const equipoSeleccionado = localStorage.getItem("equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");
  const tituloEquipo = document.getElementById("nombre-equipo");
  const btnVolver = document.getElementById("btn-volver");

  if (tituloEquipo) tituloEquipo.textContent = equipoSeleccionado;
  
  if (btnVolver) {
    btnVolver.onclick = () => { window.location.href = "menu_principal.html"; };
  }

  try {
    // 2. Consulta al Apps Script pasándole el equipo seleccionado
    const response = await fetch(`${URL_APPS_SCRIPT}?equipo=${encodeURIComponent(equipoSeleccionado)}`);
    const jugadores = await response.json();

    if (!jugadores || jugadores.length === 0) {
      contenedor.innerHTML = `<p class="cargando-texto">No hay jugadores para <b>${equipoSeleccionado}</b></p>`;
      return;
    }

    // Ordenar la lista según la Columna K (posicion)
    jugadores.sort((a, b) => Number(a.posicion) - Number(b.posicion));

    // 3. Renderizar vinculando la imagen desde GitHub (fotos/ID.jpg)
    contenedor.innerHTML = jugadores.map(jugador => {
      const idUsuario = jugador.usuario;
      const numPosicion = jugador.posicion;
      const rutaFoto = `fotos/${idUsuario}.jpg`;

      return `
        <div class="tarjeta-jugador" data-posicion="${numPosicion}" data-usuario="${idUsuario}">
          <img src="${rutaFoto}" alt="${idUsuario}" onerror="this.src='fotos/default.jpg'" loading="lazy" />
          <span>${idUsuario}</span>
        </div>
      `;
    }).join("");

    // 4. Delegación de eventos para capturar el clic
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
