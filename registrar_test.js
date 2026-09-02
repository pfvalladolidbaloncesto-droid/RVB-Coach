document.addEventListener("DOMContentLoaded", () => {
  // Inicializar fecha actual de forma segura para inputs type="date"
  const inputFecha = document.getElementById('fecha');
  if (inputFecha) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    inputFecha.value = `${year}-${month}-${day}`;
  }

  // Cargar el usuario correctamente comprobando las claves que usa el selector
  const usuarioGuardado = localStorage.getItem("User") || localStorage.getItem("jugadorSeleccionado");
  const inputNombre = document.getElementById('nombre');
  if (inputNombre) {
    if (usuarioGuardado) {
      inputNombre.value = usuarioGuardado;
    } else {
      inputNombre.value = "Sin usuario seleccionado";
    }
  }

  const selectTest = document.getElementById('test');
  const selectLateralidad = document.getElementById('lateralidad');
  const etiqueta4 = document.getElementById('etiqueta4');

  let listaTests = [];
  try {
    const testsStored = localStorage.getItem("Test");
    if (testsStored) {
      listaTests = JSON.parse(testsStored);
    }
  } catch (e) {
    listaTests = [];
  }

  if (!Array.isArray(listaTests) || listaTests.length === 0) {
    listaTests = ["SLR", "ANKLE", "DJ", "CMJ", "Abalakov"];
  }

  if (selectTest) {
    listaTests.forEach(testItem => {
      const option = document.createElement('option');
      option.value = testItem;
      option.textContent = testItem;
      selectTest.appendChild(option);
    });
  }

  function actualizarLateralidad() {
    const testSeleccionado = selectTest.value;
    const testsConLateralidad = ["SLR", "ANKLE", "DJ"];

    if (testsConLateralidad.includes(testSeleccionado)) {
      selectLateralidad.disabled = false;
      selectLateralidad.required = true;
      const latVal = selectLateralidad.value;
      if (etiqueta4) etiqueta4.textContent = latVal ? `${testSeleccionado}${latVal}` : testSeleccionado;
    } else {
      selectLateralidad.value = "";
      selectLateralidad.disabled = true;
      selectLateralidad.required = false;
      if (etiqueta4) etiqueta4.textContent = testSeleccionado;
    }
  }

  if (selectTest) {
    selectTest.addEventListener('change', actualizarLateralidad);
  }
  if (selectLateralidad) {
    selectLateralidad.addEventListener('change', actualizarLateralidad);
  }

  const btnVolver = document.getElementById('btn-volver');
  if (btnVolver) {
    btnVolver.onclick = () => {
      window.location.href = "selector.html";
    };
  }

  const formRegistrarTest = document.getElementById('form-registrar-test');
  if (formRegistrarTest) {
    formRegistrarTest.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nombreVal = document.getElementById('nombre').value;
      const fechaVal = document.getElementById('fecha').value;
      const testVal = selectTest.value;
      const lateralidadVal = selectLateralidad.disabled ? "" : selectLateralidad.value;
      const resultadoVal = document.getElementById('resultado').value;

      if (!nombreVal || !fechaVal || !testVal || !resultadoVal || (!selectLateralidad.disabled && !lateralidadVal)) {
        alert("Comprueba los campos obligatorios");
        return;
      }

      const baseUrl = "https://docs.google.com/forms/d/15YWvKXpfe_r9iPzBUpXNIdxuBihOFTol8vY35eTAEAA/formResponse";
      
      const params = new URLSearchParams({
        "entry.1509260909": nombreVal,
        "entry.2139116252": fechaVal,
        "entry.1616925557": testVal,
        "entry.1899409210": lateralidadVal,
        "entry.2040101941": resultadoVal
      });

      try {
        await fetch(`${baseUrl}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });
        alert("Test registrado con éxito");
        window.location.href = "selector.html";
      } catch (error) {
        alert("Error al enviar los datos: " + error);
      }
    });
  }
});
