const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec?accion=consultar";

// 1. Intentar leer la clave 'equipo' o 'equipoUsuario' por si usaste otro nombre
const equipoSeleccionado = localStorage.getItem("equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");
  const tituloEquipo = document.getElementById("nombre-equipo");

  // Actualizar el título con el equipo cargado
  if (tituloEquipo) {
    tituloEquipo.textContent = equipoSeleccionado;
  }

  // Evento para el botón volver
  const btnVolver = document.getElementById("btn-volver");
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      window.location.href = "menu_principal.html";
    });
  }

  try {
    const response = await fetch(URL_APPS_SCRIPT);
    const datos = await response.json();

    console.log("Datos recibidos de Google Sheets:", datos);

    // 2. Filtrar comparando texto formateado (evita fallos por mayúsculas/espacios)
    const equipoBuscado = equipoSeleccionado.toString().toLowerCase().trim();

    const jugadores = datos.filter(fila => {
      const col3 = (fila.columna3 || "").toString().toLowerCase().trim();
      const col4 = (fila.columna4 || "").toString().toLowerCase().trim();

      const esStaff = col3 === "pf" || col3 === "coach";
      return !esStaff && col4 === equipoBuscado;
    });

    console.log("Jugadores filtrados:", jugadores);

    // Si no hay jugadores encontrados, mostrar mensaje en pantalla
    if (jugadores.length === 0) {
      contenedor.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">No se encontraron jugadores para el equipo: <b>${equipoSeleccionado}</b></p>`;
      return;
    }

    // 3. Renderizar tarjetas con foto desde /fotos/ID.jpg
    contenedor.innerHTML = jugadores.map((jugador, index) => {
      const idUsuario = jugador.num;
      const rutaFoto = `fotos/${idUsuario}.jpg`;

      return `
        <div class="tarjeta-jugador" data-posicion="${index + 1}" data-usuario="${idUsuario}">
          <img src="${rutaFoto}" alt="${idUsuario}" onerror="this.src='fotos/default.jpg'" loading="lazy" />
          <span>${jugador.columna9 || jugador.columna6 || idUsuario}</span>
        </div>
      `;
    }).join("");

    // 4. Delegación de clics
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
    console.error("Error al cargar los jugadores:", error);
    contenedor.innerHTML = "<p>Error al conectar con la base de datos.</p>";
  }
});
