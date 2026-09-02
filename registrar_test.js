document.addEventListener("DOMContentLoaded", () => {
  // Inicializar fecha actual con formato YYYY-MM-DD (coherente con App Inventor Reloj1)
  const inputFecha = document.getElementById('fecha');
  if (inputFecha) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    inputFecha.value = `${year}-${month}-${day}`;
  }

  // Cargar usuario desde localStorage (equivalente a TinyDB GetValue tag "User")[cite: 1]
  const usuarioGuardado = localStorage.getItem("User") || localStorage.getItem("jugadorSeleccionado");
  if (usuarioGuardado) {
    const inputNombre = document.getElementById('nombre');
    if (inputNombre) inputNombre.value = usuarioGuardado;
  }

  // Cargar lista de tests disponibles desde localStorage (equivalente a TinyDB GetValue tag "Test")[cite: 1]
  const selectTest = document.getElementById('test');
  const selectLateralidad = document.getElementById('lateralidad');
  const etiqueta4 = document.getElementById('etiqueta4');

  // Recuperar tests guardados o usar una lista predeterminada si no existe
  let listaTests = [];
  try {
    const testsStored = localStorage.getItem("Test");
    if (testsStored) {
      listaTests = JSON.parse(testsStored);
    }
  } catch (e) {
    listaTests = [];
  }

  // Si no hay tests en localStorage, añadimos algunos por defecto comunes (incluyendo los que activan lateralidad: SLR, ANKL, DJ)[cite: 1]
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

  // Lógica de habilitación de lateralidad idéntica al bloque If/Else de App Inventor[cite: 1]
  function actualizarLateralidad() {
    const testSeleccionado = selectTest.value;
    const testsConLateralidad = ["SLR", "ANKLE", "DJ"];

    if (testsConLateralidad.includes(testSeleccionado)) {
      selectLateralidad.disabled = false;
      selectLateralidad.required = true;
      const latVal = selectLateralidad.value;
      etiqueta4.textContent = latVal ? `${testSeleccionado}${latVal}` : testSeleccionado;[cite: 1]
    } else {
      selectLateralidad.value = "";
      selectLateralidad.disabled = true;
      selectLateralidad.required = false;
      etiqueta4.textContent = testSeleccionado;[cite: 1]
    }
  }

  if (selectTest) {
    selectTest.addEventListener('change', actualizarLateralidad);
  }
  if (selectLateralidad) {
    selectLateralidad.addEventListener('change', actualizarLateralidad);
  }

  // Botón Volver (equivalente a Selector / Menú principal)[cite: 2]
  const btnVolver = document.getElementById('btn-volver');
  if (btnVolver) {
    btnVolver.onclick = () => {
      window.location.href = "selector.html";
    };
  }

  // Envío del formulario mediante Web1.Get con los entry IDs exactos de Google Forms[cite: 1, 2]
  const formRegistrarTest = document.getElementById('form-registrar-test');
  if (formRegistrarTest) {
    formRegistrarTest.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nombreVal = document.getElementById('nombre').value;
      const fechaVal = document.getElementById('fecha').value;
      const testVal = selectTest.value;
      const lateralidadVal = selectLateralidad.disabled ? "" : selectLateralidad.value;
      const resultadoVal = document.getElementById('resultado').value;

      // Validación de campos obligatorios idéntica a la lógica de bloques[cite: 1]
      if (!nombreVal || !fechaVal || !testVal || !resultadoVal || (!selectLateralidad.disabled && !lateralidadVal)) {
        alert("Comprueba los campos obligatorios");[cite: 1]
        return;
      }

      const baseUrl = "https://docs.google.com/forms/d/15YWvKXpfe_r9iPzBUpXNIdxuBihOFTol8vY35eTAEAA/formResponse";[cite: 1]
      
      const params = new URLSearchParams({
        "entry.1509260909": nombreVal,     [cite: 1]
        "entry.2139116252": fechaVal,      [cite: 1]
        "entry.1616925557": testVal,       [cite: 1]
        "entry.1899409210": lateralidadVal,[cite: 1]
        "entry.2040101941": resultadoVal   [cite: 1]
      });

      try {
        await fetch(`${baseUrl}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });[cite: 1]
        alert("Test registrado con éxito");
        window.location.href = "selector.html";[cite: 1, 2]
      } catch (error) {
        alert("Error al enviar los datos: " + error);
      }
    });
  }
});
