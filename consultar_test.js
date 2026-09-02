document.addEventListener('DOMContentLoaded', () => {
  // Recuperar nombre de usuario almacenado (equivalente a TinyDB / Nombre.Text)
  const nombreUsuario = localStorage.getItem('User') || '';
  document.getElementById('Nombre').textContent = nombreUsuario;

  const testSelect = document.getElementById('test-select');
  const lateralidadSelect = document.getElementById('lateralidad-select');

  // Botón Enviar (equivalente a Enviar.Click)
  document.getElementById('Enviar').addEventListener('click', async () => {
    let isValid = true;

    // 1. Validar si el campo test está vacío
    if (!testSelect.value || testSelect.value === "") {
      testSelect.style.backgroundColor = '#FF0000'; // Rojo
      alert("Comprueba los campos obligatorios");
      isValid = false;
    } else {
      testSelect.style.backgroundColor = '#FFFFFF'; // Blanco / por defecto
    }

    // 2. Validar si el test requiere lateralidad (SLR, ANKLE, DJ) y la lateralidad está vacía
    const testsConLateralidad = ["SLR", "ANKLE", "DJ"];
    const esTestLateral = testsConLateralidad.includes(testSelect.value);
    
    if (esTestLateral && (!lateralidadSelect.value || lateralidadSelect.value === "")) {
      lateralidadSelect.style.backgroundColor = '#FF0000'; // Rojo
      alert("Comprueba los campos obligatorios");
      isValid = false;
    } else {
      lateralidadSelect.style.backgroundColor = '#FFFFFF';
    }

    // 3. Si todo es válido, realizar la consulta (equivalente a ReadWithExactFilter)
    if (isValid) {
      const nombreHoja = localStorage.getItem('NombreHoja') || "VisualizacionTEST";
      await consultarGoogleSheet(nombreHoja, nombreUsuario, testSelect.value, lateralidadSelect.value);
    }
  });
});

// Equivalente al evento GotFilterResult y las cadenas de condicionales de los bloques largos
async function consultarGoogleSheet(sheetName, nombreUsuario, testSeleccionado, lateralidadSeleccionada) {
  try {
    // URL de tu Web App de Google Apps Script
    const urlScript = "https://script.google.com/macros/s/AKfycbxeODB3WoJxuyl8kVZNZ-ciTnWEZwKOeIKBAb7Oef-gSzT1YNVNqrabkXpPMTP_KU9Q/exec";
    const response = await fetch(`${urlScript}?sheet=${sheetName}&filter=${nombreUsuario}`);
    const rows = await response.json();

    if (rows && rows.length > 0) {
      const fila = rows[0]; // Primera coincidencia encontrada (columna 1 = nombreUsuario)

      // Construir la clave exacta igual que en tus bloques condicionales
      let combinacionTest = testSeleccionado;
      if (["SLR", "ANKLE", "DJ"].includes(testSeleccionado) && lateralidadSeleccionada) {
        combinacionTest += lateralidadSeleccionada; // Ej: SLRIZQ, SLRDCH
      }

      // Mapeo de los campos de texto según la combinación (traducción de la cadena de "if" largos)
      const campo1 = document.getElementById('CampoDeTexto1');
      const campo2 = document.getElementById('CampoDeTexto2');
      const campo3 = document.getElementById('CampoDeTexto3');
      const campo4 = document.getElementById('CampoDeTexto4');

      if (combinacionTest === "SLRIZQ") {
        campo1.value = fila[3] || ""; // Ajusta los índices según las columnas de tu hoja
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
      // Añade aquí los demás "else if" para SJ, 30-15, PESO, etc. según tus bloques.
    }
  } catch (error) {
    console.error("Error al obtener los datos de la hoja:", error);
  }
}
