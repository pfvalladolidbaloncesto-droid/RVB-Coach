function actualizarValorRPE(val) {
  const rpeValElement = document.getElementById('rpe-val');
  if (rpeValElement) {
    rpeValElement.textContent = val;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar fecha actual
  const inputFecha = document.getElementById('fecha');
  if (inputFecha) {
    inputFecha.value = new Date().toISOString().split('T')[0];
  }

  // Sincronizar el slider visualmente en tiempo real
  const sliderRpe = document.getElementById('rpe');
  if (sliderRpe) {
    sliderRpe.addEventListener("input", (e) => {
      actualizarValorRPE(e.target.value);
    });
  }

  // Lectura normalizada desde localStorage (coherente con selector.js)
  const jugadorSeleccionado = localStorage.getItem("User") || localStorage.getItem("jugadorSeleccionado");
  const equipoSeleccionado = localStorage.getItem("Equipo") || localStorage.getItem("equipoUsuario");

  if (jugadorSeleccionado) {
    const inputNombre = document.getElementById('nombre');
    if (inputNombre) inputNombre.value = jugadorSeleccionado;
  }

  if (equipoSeleccionado) {
    const selectEquipo = document.getElementById('equiposel');
    if (selectEquipo) selectEquipo.value = equipoSeleccionado;
  }

  // Botón Volver
  const btnVolver = document.getElementById('btn-volver');
  if (btnVolver) {
    btnVolver.onclick = () => {
      window.location.href = "selector.html";
    };
  }

  // Botón Menú principal
  const btnMenu = document.getElementById('btn-menu');
  if (btnMenu) {
    btnMenu.onclick = () => {
      window.location.href = "menu_principal.html";
    };
  }

  // Manejo del formulario de envío
  const formRpe = document.getElementById('form-rpe');
  if (formRpe) {
    formRpe.addEventListener('submit', async (event) => {
      event.preventDefault();

      const rpeVal = sliderRpe ? sliderRpe.value : "5";
      const baseUrl = "https://docs.google.com/forms/d/1eca4eShUyVGaxiuB13ONX_dzXynArxuUQmtfFBx5veU/formResponse";
      
      const params = new URLSearchParams({
        "entry.1206689442": document.getElementById('fecha').value,
        "entry.1144883834": document.getElementById('nombre').value,
        "entry.697775640": document.getElementById('equiposel').value,
        "entry.1150680246": document.getElementById('entrenamiento').value,
        "entry.961295529": rpeVal,
        "entry.1650450183": document.getElementById('estatus').value,
        "entry.1691140284": document.getElementById('comentarios').value
      });

      try {
        await fetch(`${baseUrl}?${params.toString()}`, { method: 'POST', mode: 'no-cors' });
        alert("RPE registrado con éxito");
        window.location.href = "selector.html";
      } catch (error) {
        alert("Error al enviar los datos: " + error);
      }
    });
  }
});
