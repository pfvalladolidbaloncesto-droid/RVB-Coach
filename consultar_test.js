document.addEventListener('DOMContentLoaded', () => {
  const nombreUsuario = localStorage.getItem('User') || '';
  document.getElementById('Nombre').textContent = nombreUsuario;

  const testSelect = document.getElementById('test-select');
  const lateralidadSelect = document.getElementById('lateralidad-select');

  // Controlar cuándo se habilita la lateralidad según el test
  testSelect.addEventListener('change', (e) => {
    const valorSeleccionado = e.target.value;
    const testsConLateralidad = ["SLR", "ANKLE", "DJ"];
    
    if (testsConLateralidad.includes(valorSeleccionado)) {
      lateralidadSelect.disabled = false;
    } else {
      lateralidadSelect.disabled = true;
      lateralidadSelect.value = ''; 
      lateralidadSelect.style.backgroundColor = '#FFFFFF';
    }
  });

  // Botón Enviar / Consultar
  document.getElementById('Enviar').addEventListener('click', async () => {
    let isValid = true;

    if (!testSelect.value || testSelect.value === "") {
      testSelect.style.backgroundColor = '#FF0000';
      alert("Comprueba los campos obligatorios");
      isValid = false;
    } else {
      testSelect.style.backgroundColor = '#FFFFFF';
    }

    const testsConLateralidad = ["SLR", "ANKLE", "DJ"];
    if (testsConLateralidad.includes(testSelect.value) && (!lateralidadSelect.value || lateralidadSelect.value === "")) {
      lateralidadSelect.style.backgroundColor = '#FF0000';
      alert("Comprueba los campos obligatorios");
      isValid = false;
    } else {
      lateralidadSelect.style.backgroundColor = '#FFFFFF';
    }

    if (isValid) {
      const nombreHoja = localStorage.getItem('NombreHoja') || "VisualizacionTEST";
      await consultarGoogleSheet(nombreHoja, nombreUsuario, testSelect.value, lateralidadSelect.value);
    }
  });
});

async function consultarGoogleSheet(sheetName, nombreUsuario, testSeleccionado, lateralidadSeleccionada) {
  try {
    const urlScript = "https://script.google.com/macros/s/AKfycbxeODB3WoJxuyl8kVZNZ-ciTnWEZwKOeIKBAb7Oef-gSzT1YNVNqrabkXpPMTP_KU9Q/exec";
    const response = await fetch(`${urlScript}?sheet=${sheetName}&filter=${nombreUsuario}`);
    const rows = await response.json();

    if (rows && rows.length > 0) {
      const fila = rows[0]; 

      let combinacionTest = testSeleccionado;
      if (["SLR", "ANKLE", "DJ"].includes(testSeleccionado) && lateralidadSeleccionada) {
        combinacionTest += lateralidadSeleccionada; 
      }

      const campo1 = document.getElementById('CampoDeTexto1');
      const campo2 = document.getElementById('CampoDeTexto2');
      const campo3 = document.getElementById('CampoDeTexto3');
      const campo4 = document.getElementById('CampoDeTexto4');

      // Limpiar campos antes de rellenar
      campo1.value = "";
      campo2.value = "";
      campo3.value = "";
      campo4.value = "";

      if (combinacionTest === "SLRIZQ") {
        campo1.value = fila[3] || ""; 
        campo2.value = fila[4] || "";
        campo3.value = fila[5] || "";
        campo4.value = fila[6] || "";
      } else if (combinacionTest === "SLRDCH") {
        campo1.value = fila[7] || "";
        campo2.value = fila[8] || "";
        campo3.value = fila[9] || "";
        campo4.value = fila[10] || "";
      } else if (testSeleccionado === "CMJ") {
        campo1.value = fila[11] || "";
        campo2.value = fila[12] || "";
        campo3.value = fila[13] || "";
        campo4.value = fila[14] || "";
      } 
      // Añade aquí más 'else if' para el resto de tus tests (SJ, 30-15, PESO, etc.)
    }
  } catch (error) {
    console.error("Error al obtener los datos de la hoja:", error);
  }
}
