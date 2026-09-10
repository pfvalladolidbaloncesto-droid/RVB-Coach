const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjNjsoJvliC8sZPLhLYUS9pcJ19d5uu49szu7RjnPBBMmAM6ZgD515hNhHulAxbsMCwQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const etiquetaUsuario = document.getElementById("etiquetaUsuario");
  const inputFecha = document.getElementById("inputFecha");
  const gridContainer = document.getElementById("gridContainer");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnVolver = document.getElementById("btnVolver");

  // 1. Usuario y Equipo desde localStorage (con cortocircuito exacto)
  const usuarioActual = localStorage.getItem("Usuario") || "Usuario";
  const equipoSeleccionado = localStorage.getItem("Equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = `Usuario: ${usuarioActual} (PF) - Equipo: ${equipoSeleccionado}`;
  }

  // 2. Fecha actual en formato YYYY-MM-DD para el input date
  if (inputFecha) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    inputFecha.value = `${anio}-${mes}-${dia}`;
  }

  // Función para renderizar el grid a partir de la lista de jugadores obtenida
  function construirGrid(idsPlantilla) {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    const totalFilas = idsPlantilla.length + 3;

    for (let i = 0; i < totalFilas; i++) {
      const tieneId = i < idsPlantilla.length;
      const idValor = tieneId ? idsPlantilla[i] : "";
      const switchActivo = tieneId;

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
  }

  // 3. Lectura de caché local usando plantilla_${equipoSeleccionado} igual que la otra pestaña
  const cacheClave = `plantilla_${equipoSeleccionado}`;
  const datosCache = localStorage.getItem(cacheClave);

  let idsPlantilla = [];
  if (datosCache) {
    try {
      const jugadoresCache = JSON.parse(datosCache);
      // Extraemos las propiedades de usuario igual que en la otra vista si viene como objetos
      idsPlantilla = jugadoresCache.map(j => (typeof j === 'string' ? j : (j.usuario || j.id || '')));
    } catch (e) {
      console.error("Error al leer caché:", e);
    }
  }

  // Renderizamos inicialmente con caché si existe
  construirGrid(idsPlantilla);

  // 4. Consulta en segundo plano a Google Apps Script para asegurar datos frescos
  try {
    const response = await fetch(`${URL_APPS_SCRIPT}?equipo=${encodeURIComponent(equipoSeleccionado)}`);
    const jugadoresRed = await response.json();
    
    if (Array.isArray(jugadoresRed) && jugadoresRed.length > 0) {
      localStorage.setItem(cacheClave, JSON.stringify(jugadoresRed));
      idsPlantilla = jugadoresRed.map(j => (typeof j === 'string' ? j : (j.usuario || j.id || '')));
      construirGrid(idsPlantilla);
    }
  } catch (error) {
    console.error("Error al consultar Google Apps Script:", error);
  }

  // Botón Volver
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      window.location.href = "menu_principal.html";
    });
  }

  // Botón Guardar
  if (btnGuardar) {
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
            fecha: inputFecha ? inputFecha.value : ""
          });
        }
      });

      console.log("Datos a guardar:", datosPartido);
      alert("Datos de RPE partido capturados correctamente en consola.");
    });
  }
});
