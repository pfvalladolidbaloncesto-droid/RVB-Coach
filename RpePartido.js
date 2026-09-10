const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjNjsoJvliC8sZPLhLYUS9pcJ19d5uu49szu7RjnPBBMmAM6ZgD515hNhHulAxbsMCwQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const etiquetaUsuario = document.getElementById("etiquetaUsuario");
  const inputFecha = document.getElementById("inputFecha");
  const gridContainer = document.getElementById("gridContainer");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnVolver = document.getElementById("btnVolver");

  // 1. Usuario y Equipo desde localStorage con cortocircuito
  const usuarioActual = localStorage.getItem("Usuario") || "Usuario";
  const equipoSeleccionado = localStorage.getItem("Equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = `Usuario: ${usuarioActual} (PF) - Equipo: ${equipoSeleccionado}`;
  }

  // 2. Fecha actual en formato YYYY-MM-DD
  if (inputFecha) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    inputFecha.value = `${anio}-${mes}-${dia}`;
  }

  // Listas de equipos permitidos
  const equiposDisponibles = ["Infantil B", "Infantil A", "Cadete B", "Cadete A", "Junior B", "Junior A", "Tercera"];
  const estadosDisponibles = ["Completo", "Limitado", "Ausente", "Lesionado"];

  // Función para renderizar la cabecera fija del grid y las filas
  function construirGrid(idsPlantilla) {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    // 6. Incluir Headers en el grid
    const headerRow = document.createElement("div");
    headerRow.className = "grid-header";
    headerRow.style.display = "grid";
    headerRow.style.gridTemplate-columns = "50px 1fr 80px 120px 1fr";
    headerRow.style.gap = "8px";
    headerRow.style.fontWeight = "bold";
    headerRow.style.padding = "4px 8px";
    headerRow.style.fontSize = "0.85rem";
    headerRow.style.color = "#4b5563";
    headerRow.innerHTML = `
      <div></div>
      <div>ID</div>
      <div>Min</div>
      <div>Estatus</div>
      <div>Equipo</div>
    `;
    gridContainer.appendChild(headerRow);

    const totalFilas = idsPlantilla.length + 3;

    for (let i = 0; i < totalFilas; i++) {
      const tieneId = i < idsPlantilla.length;
      const idValor = tieneId ? idsPlantilla[i] : "";
      const switchActivo = tieneId;

      const row = document.createElement("div");
      row.className = `grid-row ${!switchActivo ? 'disabled' : ''}`;

      // Opciones de equipo (3) preseleccionando el equipo actual o el guardado
      let opcionesEquipoHtml = "";
      equiposDisponibles.forEach(eq => {
        const selected = (eq === equipoSeleccionado) ? "selected" : "";
        opcionesEquipoHtml += `<option value="${eq}" ${selected}>${eq}</option>`;
      });

      // Opciones de estado (2) por defecto "Completo"
      let opcionesEstadoHtml = "";
      estadosDisponibles.forEach(est => {
        const selected = (est === "Completo") ? "selected" : "";
        opcionesEstadoHtml += `<option value="${est}" ${selected}>${est}</option>`;
      });

      row.innerHTML = `
        <div style="text-align: center;">
          <input type="checkbox" class="row-switch" ${switchActivo ? 'checked' : ''} />
        </div>
        <div>
          <input type="text" class="input-id" value="${idValor}" placeholder="ID Jugador" ${!switchActivo ? 'disabled' : ''} />
        </div>
        <div>
          <input type="number" class="input-minutos" min="0" step="1" placeholder="Min" ${!switchActivo ? 'disabled' : ''} />
        </div>
        <div>
          <select class="input-status" ${!switchActivo ? 'disabled' : ''}>
            ${opcionesEstadoHtml}
          </select>
        </div>
        <div>
          <select class="input-equipo" ${!switchActivo ? 'disabled' : ''}>
            ${opcionesEquipoHtml}
          </select>
        </div>
      `;

      const rowSwitch = row.querySelector(".row-switch");
      const inputsFila = row.querySelectorAll("input:not(.row-switch), select");

      // 5. Validación estricta para que la casilla de Minutos solo acepte números enteros positivos
      const inputMinutos = row.querySelector(".input-minutos");
      inputMinutos.addEventListener("input", (e) => {
        let val = e.target.value;
        val = val.replace(/[^0-9]/g, '');
        if (val !== "" && parseInt(val, 10) < 0) {
          val = "0";
        }
        e.target.value = val;
      });

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

  // 1. Mostrar Charging Spinner inicial mientras se carga la lista
  if (gridContainer) {
    gridContainer.innerHTML = `
      <div style="text-align: center; padding: 30px;">
        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px auto;"></div>
        <span style="color: #6b7280; font-size: 0.9rem;">Cargando plantilla...</span>
      </div>
    `;
  }

  // Estilo dinámico para la animación del spinner
  if (!document.getElementById("spinner-style")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "spinner-style";
    styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(styleSheet);
  }

  // 3. Lectura de caché local
  const cacheClave = `plantilla_${equipoSeleccionado}`;
  const datosCache = localStorage.getItem(cacheClave);

  let idsPlantilla = [];
  if (datosCache) {
    try {
      const jugadoresCache = JSON.parse(datosCache);
      idsPlantilla = jugadoresCache.map(j => (typeof j === 'string' ? j : (j.usuario || j.id || '')));
    } catch (e) {
      console.error("Error al leer caché:", e);
    }
  }

  // Render inicial con caché
  construirGrid(idsPlantilla);

  // 4. Consulta en segundo plano a Google Apps Script
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

  // 4. Botón renombrado a "Enviar RPE partido"
  if (btnGuardar) {
    btnGuardar.textContent = "Enviar RPE partido";
    btnGuardar.addEventListener("click", () => {
      const filas = gridContainer.querySelectorAll(".grid-row:not(.grid-header)");
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

      console.log("Datos a enviar:", datosPartido);
      alert("Datos de RPE partido preparados para enviar.");
    });
  }
});
