// URL de tu nuevo Google Apps Script
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxRkqgMqJCQDpgb9lTEJZuVztt2XV3BE1vdqAd6QinTIi0ZXlBpRwqniKjFcMQru1NJVA/exec";

// Recuperar el equipo guardado en el Login o Menú Principal
const equipoSeleccionado = localStorage.getItem("equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");
  const tituloEquipo = document.getElementById("nombre-equipo");

  // Mostrar el nombre del equipo en el encabezado
  if (tituloEquipo) {
    tituloEquipo.textContent = equipoSeleccionado;
  }

  // Configurar botón volver
  const btnVolver = document.getElementById("btn-volver");
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      window.location.href = "menu_principal.html";
    });
  }

  try {
    // 1. Obtener los datos globales de la Hoja 1 desde el nuevo Apps Script
    const response = await fetch(URL_APPS_SCRIPT);
    const datos = await response.json();

    const equipoBuscado = equipoSeleccionado.toString().toLowerCase().trim();

    // 2. Filtrar los jugadores de la Columna 4 excluyendo los "PF" y "Coach" de la Columna 3
    const jugadores = datos.filter(fila => {
      const col3 = (fila.columna3 || "").toString().toLowerCase().trim();
      const col4 = (fila.columna4 || "").toString().toLowerCase().trim();

      const esStaff = col3 === "pf" || col3 === "coach";
      return !esStaff && col4 === equipoBuscado;
    });

    // Si no se encuentran jugadores, avisar en pantalla
    if (jugadores.length === 0) {
      contenedor.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">No se encontraron jugadores para el equipo: <b>${equipoSeleccionado}</b></p>`;
      return;
    }

    // 3. Renderizar las tarjetas
    // Prioridad de foto: 1° Columna 10 (Google Sheets), 2° fotos/ID.jpg, 3° fotos/default.jpg
    contenedor.innerHTML = jugadores.map((jugador, index) => {
      const idUsuario = jugador.num;
      const fotoSheet = jugador.columna10;
      const fotoLocal = `fotos/${idUsuario}.jpg`;
      const fotoSrc = (fotoSheet && fotoSheet.toString().startsWith("http")) ? fotoSheet : fotoLocal;

      return `
        <div class="tarjeta-jugador" data-posicion="${index + 1}" data-usuario="${idUsuario}">
          <img src="${fotoSrc}" alt="${idUsuario}" onerror="this.src='fotos/default.jpg'" loading="lazy" />
          <span>${jugador.columna9 || jugador.columna6 || idUsuario}</span>
        </div>
      `;
    }).join("");

    // 4. Guardar selección al hacer clic en un jugador
    contenedor.addEventListener("click", (e) => {
      const tarjeta = e.target.closest(".tarjeta-jugador");
      if (!tarjeta) return;

      const posicion = tarjeta.dataset.posicion;
      const usuarioSeleccionado = tarjeta.dataset.usuario;

      localStorage.setItem("posicionSeleccionada", posicion);
      localStorage.setItem("jugadorSeleccionado", usuarioSeleccionado);

      window.location.href = "detalle.html";
    });

  } catch (error) {
    console.error("Error al conectar con Google Apps Script:", error);
    if (contenedor) {
      contenedor.innerHTML = "<p style='text-align:center; color:red;'>Error al cargar los datos desde la plantilla.</p>";
    }
  }
});
