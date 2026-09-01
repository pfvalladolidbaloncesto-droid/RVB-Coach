// URL de tu Web App de Google Apps Script existente (sin modificar)
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec?accion=consultar";

// Recuperar el equipo guardado en el Login
const equipoSeleccionado = localStorage.getItem("equipo");

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");

  try {
    const response = await fetch(URL_APPS_SCRIPT);
    const datos = await response.json();

    // 1. Filtrar los jugadores por equipo excluyendo PF y Coach
    const jugadores = datos.filter(fila => {
      const col3 = (fila.columna3 || "").toString().toLowerCase().trim();
      const col4 = fila.columna4;

      const esStaff = col3 === "pf" || col3 === "coach";
      return !esStaff && col4 === equipoSeleccionado;
    });

    // 2. Renderizar la cuadrícula cargando la foto según el ID (fila.num)
    contenedor.innerHTML = jugadores.map((jugador, index) => {
      const idUsuario = jugador.num; // Ej: "RAUPOPA"
      const rutaFoto = `fotos/${idUsuario}.jpg`;

      return `
        <div class="tarjeta-jugador" data-posicion="${index + 1}" data-usuario="${idUsuario}">
          <img src="${rutaFoto}" alt="${idUsuario}" onerror="this.src='fotos/default.jpg'" loading="lazy" />
          <span>${jugador.columna9 || jugador.columna6 || idUsuario}</span>
        </div>
      `;
    }).join("");

    // 3. Delegación de eventos para el Clic en cualquier jugador
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
  }
});
