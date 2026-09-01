// 1. Obtener el equipo guardado en el Login
const equipoActual = localStorage.getItem("equipo") || "Junior A";

// 2. Base de datos local de jugadores por equipo
const EQUIPOS_DATA = {
  "Junior A": [
    { id: 1, foto: "cbc.jpg", nombre: "Jugador 1" },
    { id: 2, foto: "cbc.jpg", nombre: "Jugador 2" }
    // ... completa los 16 aquí
  ],
  "Cadete A": [
    { id: 1, foto: "assets/cadete_a/1.jpg", nombre: "Jugador 1" }
    // ... completa los 16 aquí
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nombre-equipo").textContent = equipoActual;
  
  const contenedor = document.getElementById("grid-jugadores");
  const listaJugadores = EQUIPOS_DATA[equipoActual] || [];

  // Renderizar las 16 imágenes dinámicamente
  contenedor.innerHTML = listaJugadores.map((jugador, index) => `
    <div class="tarjeta-jugador" data-posicion="${index + 1}" data-id="${jugador.id}">
      <img src="${jugador.foto}" alt="${jugador.nombre}" loading="lazy" />
      <span>${jugador.nombre}</span>
    </div>
  `).join("");

  // Evento Clic único para toda la cuadrícula (Delegación de Eventos)
  contenedor.addEventListener("click", (e) => {
    const tarjeta = e.target.closest(".tarjeta-jugador");
    if (!tarjeta) return;

    const posicion = tarjeta.dataset.posicion;
    const jugadorId = tarjeta.dataset.id;

    // Guardar selección en LocalStorage (reemplaza a TinyDB)
    localStorage.setItem("posicionSeleccionada", posicion);
    localStorage.setItem("jugadorSeleccionado", jugadorId);

    // Navegar a la pantalla final
    window.location.href = "detalle.html";
  });

  // Botón Volver
  document.getElementById("btn-volver").addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });
});
