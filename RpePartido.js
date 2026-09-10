const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjNjsoJvliC8sZPLhLYUS9pcJ19d5uu49szu7RjnPBBMmAM6ZgD515hNhHulAxbsMCwQ/exec";
const URL_ENVIO_POST = "https://script.google.com/macros/s/AKfycbyZHW0N19vSMNDvH15MJE5eXVdlQ6D4PMJu_s-b9HmChEtAs4djMZietcngKARx6LJX1A/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const etiquetaUsuario = document.getElementById("etiquetaUsuario");
  const inputFecha = document.getElementById("inputFecha");
  const gridContainer = document.getElementById("gridContainer");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnVolver = document.getElementById("btnVolver");

  const usuarioActual = localStorage.getItem("Usuario") || "Usuario";
  const equipoSeleccionado = localStorage.getItem("Equipo") || localStorage.getItem("equipoUsuario") || "Junior A";

  if (etiquetaUsuario) {
    etiquetaUsuario.textContent = `Usuario: ${usuarioActual} (PF) - Equipo: ${equipoSeleccionado}`;
  }

  if (inputFecha) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    inputFecha.value = `${anio}-${mes}-${dia}`;
  }

  const equiposDisponibles = ["Infantil B", "Infantil A", "Cadete B", "Cadete A", "Junior B", "Junior A", "Tercera"];
  const estadosDisponibles = ["Completo", "Limitado", "Ausente", "Lesionado"];

  function mostrarSpinnerCarga() {
    if (!gridContainer) return;
    gridContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 0; gap: 15px;">
        <div class="spinner" style="border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; width: 45px; height: 45px; animation: spin 1s linear infinite;"></div>
        <span style="color: #1e3a8a; font-weight: 600; font-size: 0.95rem;">Cargando datos principales...</span>
      </div>
    `;
  }

  if (!document.getElementById("spinner-style")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "spinner-style";
    styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(styleSheet);
  }

  function construirGrid(idsPlantilla) {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    const headerRow = document.createElement("div");
    headerRow.className = "grid-header";
    headerRow.style.display = "grid";
    headerRow.style.gridTemplateColumns = "50px 1fr 80px 120px 1fr";
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

      let opcionesEquipoHtml = "";
      equiposDisponibles.forEach(eq => {
        const selected = (eq === equipoSeleccionado) ? "selected" : "";
        opcionesEquipoHtml += `<option value="${eq}" ${selected}>${eq}</option>`;
      });

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

  mostrarSpinnerCarga();

  const cacheClave = `plantilla_${equipoSeleccionado}`;
  let idsPlantilla = [];
  let datosCargados = false;

  try {
    const response = await fetch(`${URL_APPS_SCRIPT}?equipo=${encodeURIComponent(equipoSeleccionado)}`);
    const jugadoresRed = await response.json();
    
    if (Array.isArray(jugadoresRed) && jugadoresRed.length > 0) {
      localStorage.setItem(cacheClave, JSON.stringify(jugadoresRed));
      idsPlantilla = jugadoresRed.map(j => (typeof j === 'string' ? j : (j.usuario || j.id || '')));
      datosCargados = true;
    }
  } catch (error) {
    console.error("Error al consultar Google Apps Script en red:", error);
  }

  if (!datosCargados) {
    const datosCache = localStorage.getItem(cacheClave);
    if (datosCache) {
      try {
        const jugadoresCache = JSON.parse(datosCache);
        idsPlantilla = jugadoresCache.map(j => (typeof j === 'string' ? j : (j.usuario || j.id || '')));
      } catch (e) {
        console.error("Error al leer caché:", e);
      }
    }
  }

  construirGrid(idsPlantilla);

  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      window.location.href = "menu_principal.html";
    });
  }

  if (btnGuardar) {
    btnGuardar.textContent = "Enviar RPE partido";
    btnGuardar.addEventListener("click", async () => {
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

      if (datosPartido.length === 0) {
        alert("No hay filas activas para enviar.");
        return;
      }

      console.log("➡️ [PWA] Datos a enviar:", datosPartido);

      try {
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Enviando...";

        await fetch(URL_ENVIO_POST, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify(datosPartido)
        });

        console.log("✅ [PWA] Petición enviada correctamente (modo no-cors).");
        alert("Datos de RPE partido enviados correctamente al Spreadsheet.");
      } catch (error) {
        console.error("❌ [PWA] Error crítico en el fetch:", error);
        alert("Hubo un error al enviar los datos.");
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Enviar RPE partido";
      }
    });
  }
});
