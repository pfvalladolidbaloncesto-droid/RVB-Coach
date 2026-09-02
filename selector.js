const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjNjsoJvliC8sZPLhLYUS9pcJ19d5uu49szu7RjnPBBMmAM6ZgD515hNhHulAxbsMCwQ/exec";
const FOTO_DEFAULT = "fotos/none.jpeg";

const equipoSeleccionado = localStorage.getItem("equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

// Determina la pantalla destino en función de la opción elegida en menu_principal
function obtenerPantallaDestino() {
  const accion = localStorage.getItem("Variable");

  switch (accion) {
    case "Readiness":
      return "screen2.html";
    case "RPE":
      return "rpe.html";
    case "Registrar test":
      return "registrar_test.html";
    case "Consultar test":
      return "consultar_test.html";
    case "Carga Jugador":
      return "carga_jugador.html";
    default:
      return "screen2.html";
  }
}

function obtenerRutaFoto(idUsuario) {
  return new Promise((resolve) => {
    const img = new Image();
    const ruta = `fotos/${idUsuario}.jpeg`;
    img.onload = () => resolve(ruta);
    img.onerror = () => resolve(FOTO_DEFAULT);
    img.src = ruta;
  });
}

async function renderizarGrid(jugadores) {
  const contenedor = document.getElementById("grid-jugadores");
  if (!jugadores || jugadores.length === 0) {
    contenedor.innerHTML = `<p class="cargando-texto">No hay jugadores para <b>${equipoSeleccionado}</b></p>`;
    return;
  }

  const mapaJugadores = {};
  jugadores.forEach(j => {
    const pos = parseInt(j.posicion, 10);
    if (!isNaN(pos)) mapaJugadores[pos] = j.usuario;
  });

  const promesasFotos = [];
  for (let i = 1; i <= 16; i++) {
    const idUsuario = mapaJugadores[i];
    if (idUsuario) {
      promesasFotos.push(obtenerRutaFoto(idUsuario));
    } else {
      promesasFotos.push(Promise.resolve(null));
    }
  }

  const rutasResueltas = await Promise.all(promesasFotos);

  let htmlGrid = "";
  for (let i = 1; i <= 16; i++) {
    const idUsuario = mapaJugadores[i];
    const rutaFoto = rutasResueltas[i - 1];

    if (idUsuario) {
      htmlGrid += `
        <div class="celda-grid tarjeta-jugador" data-posicion="${i}" data-usuario="${idUsuario}">
          <img class="avatar-foto" src="${rutaFoto}" alt="" />
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
}

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("grid-jugadores");
  const tituloEquipo = document.getElementById("nombre-equipo");
  const btnVolver = document.getElementById("btn-volver");

  if (tituloEquipo) tituloEquipo.textContent = equipoSeleccionado;
  if (btnVolver) btnVolver.onclick = () => { window.location.href = "menu_principal.html"; };

  // Escucha clics en las tarjetas de jugadores
  contenedor.addEventListener("click", (e) => {
    const tarjeta = e.target.closest(".tarjeta-jugador");
    if (!tarjeta) return;

    const idUsuario = tarjeta.dataset.usuario;
    const posicion = tarjeta.dataset.posicion;

    // Guarda en localStorage con todas las claves compatibles
    localStorage.setItem("posicionSeleccionada", posicion);
    localStorage.setItem("jugadorSeleccionado", idUsuario);
    localStorage.setItem("User", idUsuario);
    localStorage.setItem("Usuario", idUsuario);

    // Navega a la pantalla destino
    window.location.href = obtenerPantallaDestino();
  });

  // Lectura rápida desde la caché local
  const cacheClave = `plantilla_${equipoSeleccionado}`;
  const datosCache = localStorage.getItem(cacheClave);

  if (datosCache) {
    try {
      const jugadoresCache = JSON.parse(datosCache);
      await renderizarGrid(jugadoresCache);
    } catch (e) {
      console.error("Error al leer caché:", e);
    }
  }

  // Consulta en segundo plano
  try {
    const response = await fetch(`${URL_APPS_SCRIPT}?equipo=${encodeURIComponent(equipoSeleccionado)}`);
    const jugadores = await response.json();

    localStorage.setItem(cacheClave, JSON.stringify(jugadores));
    await renderizarGrid(jugadores);
  } catch (error) {
    console.error("Error al consultar Google Apps Script:", error);
    if (!datosCache) {
      contenedor.innerHTML = "<p class='cargando-texto' style='color:red;'>Error de conexión con la base de datos.</p>";
    }
  }
});
