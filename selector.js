console.log("--> selector.js se ha cargado correctamente");

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxdPBRk_cUzzhT-NkjLkjTIuzs_YUAC3z-R88p7Nh-KZK6YxREiue0ctho1c1pNabndaQ/exec?accion=consultar";

// Leer equipo del login
const equipoSeleccionado = localStorage.getItem("equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

async function iniciarSelector() {
  console.log("--> Iniciando carga para el equipo:", equipoSeleccionado);
  
  const contenedor = document.getElementById("grid-jugadores");
  const tituloEquipo = document.getElementById("nombre-equipo");
  const btnVolver = document.getElementById("btn-volver");

  if (tituloEquipo) tituloEquipo.textContent = equipoSeleccionado;

  if (btnVolver) {
    btnVolver.onclick = () => { window.location.href = "menu_principal.html"; };
  }

  try {
    console.log("--> Pidiendo datos a Google Sheets...");
    const response = await fetch(URL_APPS_SCRIPT);
    const datos = await response.json();

    console.log("--> Datos completos recibidos:", datos);

    const equipoBuscado = equipoSeleccionado.toString().toLowerCase().trim();

    // Filtrar excluyendo PF y Coach
    const jugadores = datos.filter(fila => {
      const col3 = (fila.columna3 || "").toString().toLowerCase().trim();
      const col4 = (fila.columna4 || "").toString().toLowerCase().trim();
      const esStaff = col3 === "pf" || col3 === "coach";
      return !esStaff && col4 === equipoBuscado;
    });

    console.log("--> Jugadores filtrados para la cuadrícula:", jugadores);

    if (jugadores.length === 0) {
      contenedor.innerHTML = `<p style="text-align:center;">No hay jugadores para <b>${equipoSeleccionado}</b></p>`;
      return;
    }

    // Dibujar tarjetas
    contenedor.innerHTML = jugadores.map((jugador, index) => {
      const idUsuario = jugador.num;
      const rutaFoto = `fotos/${idUsuario}.jpg`;

      return `
        <div class="tarjeta-jugador" data-posicion="${index + 1}" data-usuario="${idUsuario}" style="border: 1px solid #ccc; padding: 10px; margin: 5px; display: inline-block; text-align: center; cursor: pointer;">
          <img src="${rutaFoto}" alt="${idUsuario}" onerror="this.src='https://via.placeholder.com/100'" style="width: 100px; height: 100px; object-fit: cover;" />
          <br>
          <span><b>${jugador.columna9 || jugador.columna6 || idUsuario}</b></span>
        </div>
      `;
    }).join("");

    // Guardar selección al hacer clic
    contenedor.onclick = (e) => {
      const tarjeta = e.target.closest(".tarjeta-jugador");
      if (!tarjeta) return;

      localStorage.setItem("posicionSeleccionada", tarjeta.dataset.posicion);
      localStorage.setItem("jugadorSeleccionado", tarjeta.dataset.usuario);

      window.location.href = "detalle.html";
    };

  } catch (error) {
    console.error("--> Error durante la ejecución:", error);
    if (contenedor) contenedor.innerHTML = "<p style='color:red;'>Error al conectar con la base de datos.</p>";
  }
}

// Ejecutar automáticamente al cargar el DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarSelector);
} else {
  iniciarSelector();
}
