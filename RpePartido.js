document.addEventListener("DOMContentLoaded", () => {
  const etiquetaUsuario = document.getElementById("etiquetaUsuario");
  const inputFecha = document.getElementById("inputFecha");
  const gridContainer = document.getElementById("gridContainer");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnVolver = document.getElementById("btnVolver");

  // 1. Usuario y Equipo desde localStorage
  const usuarioActual = localStorage.getItem("Usuario") || "Usuario";
  const equipoSeleccionado = localStorage.getItem("Equipo") || "";

  etiquetaUsuario.textContent = `Usuario: ${usuarioActual} (PF) - Equipo: ${equipoSeleccionado}`;

  // 2. Fecha actual en formato YYYY-MM-DD para el input date (español por defecto)
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  inputFecha.value = `${anio}-${mes}-${dia}`;

  // 3. Cargar plantilla de IDs desde caché
  const cacheClave = `plantilla_${equipoSeleccionado}`;
  let idsPlantilla = [];
  try {
    idsPlantilla = JSON.parse(localStorage.getItem(cacheClave)) || [];
  } catch (e) {
    idsPlantilla = [];
  }

  // 4. Calcular total de filas (N IDs + 3 adicionales)
  const totalFilas = idsPlantilla.length + 3;

  // 5. Renderizar grid de 5 columnas
  for (let i = 0; i < totalFilas; i++) {
    const tieneId = i < idsPlantilla.length;
    const idValor = tieneId ? idsPlantilla[i] : "";
    const switchActivo = tieneId; // Activado si tiene ID, desactivado en los 3 extras

    const row = document.createElement("div");
    row.className = `grid-row ${!switchActivo ? 'disabled' : ''}`;

    row.innerHTML = `
      <div style="text-align: center;">
        <input type="checkbox" class="row-switch" ${switchActivo ? 'checked' : ''} />
      </div>
      <div>
        <input type="text" class="input-id" value="${idValor}" placeholder="ID Jugador" ${!switchActivo ? 'disabled' : ''} />
      </div>
      <div>
        <input type="number" class="input-minutos" placeholder="Min" ${!switchActivo ? 'disabled' : ''} />
      </div>
      <div>
        <select class="input-status" ${!switchActivo ? 'disabled' : ''}>
          <option value="Titular">Titular</option>
          <option value="Suplente">Suplente</option>
          <option value="No convocado">No convocado</option>
        </select>
      </div>
      <div>
        <input type="text" class="input-equipo" value="${equipoSeleccionado}" readonly />
      </div>
    `;

    // Lógica del switch para habilitar/deshabilitar la fila
    const rowSwitch = row.querySelector(".row-switch");
    const inputsFila = row.querySelectorAll("input:not(.row-switch), select");

    rowSwitch.addEventListener("change", () => {
      const activo = rowSwitch.checked;
      if (activo) {
        row.classList.remove("disabled");
        inputsFila.forEach(input => input.removeAttribute("disabled"));
      } else {
        row.classList.add("disabled");
        inputsFila.forEach(input => input.setAttribute("disabled", "true"));
      }
    });

    gridContainer.appendChild(row);
  }

  // Botón Volver
  btnVolver.addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });

  // Botón Guardar
  btnGuardar.addEventListener("click", () => {
    const filas = gridContainer.querySelectorAll(".grid-row");
    const datosPartido = [];

    filas.forEach(row => {
      const rowSwitch = row.querySelector(".row-switch").checked;
      if (rowSwitch) {
        datosPartido.push({
          id: row.querySelector(".input-id").value,
          minutos: row.querySelector(".input-minutos").value,
          status: row.querySelector(".input-status").value,
          equipo: row.querySelector(".input-equipo").value,
          fecha: inputFecha.value
        });
      }
    });

    console.log("Datos a guardar:", datosPartido);
    alert("Datos de RPE partido capturados correctamente en consola.");
  });
});
