// Función para formatear fechas a DD/MM/AAAA
function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return fechaStr; // Si no es fecha válida, devuelve original
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const nombreUsuario = localStorage.getItem('User') || '';
  if (nombreUsuario) {
    document.getElementById('Nombre').textContent = nombreUsuario;
  }

  const testSelect = document.getElementById('test-select');
  const lateralidadSelect = document.getElementById('lateralidad-select');

  // Controlar cuándo se habilita o deshabilita la lateralidad según el test
  function actualizarLateralidad() {
    const valorSeleccionado = testSelect.value;
    const testsConLateralidad = ["SLR", "ANKLE", "DJ"];
    
    if (testsConLateralidad.includes(valorSeleccionado)) {
      lateralidadSelect.disabled = false;
      lateralidadSelect.style.backgroundColor = '#FFFFFF';
    } else {
      lateralidadSelect.disabled = true;
      lateralidadSelect.value = ''; 
      lateralidadSelect.style.backgroundColor = '#f8f9fa';
    }
  }

  // Ejecutar al cargar la página por si el valor inicial requiere lateralidad
  actualizarLateralidad();
  testSelect.addEventListener('change', actualizarLateralidad);

  // Botón Consultar
  document.getElementById('Enviar').addEventListener('click', async () => {
    let isValid = true;

    if (!testSelect.value || testSelect.value === "") {
      testSelect.style.borderColor = '#FF0000';
      alert("Comprueba los campos obligatorios");
      isValid = false;
    } else {
      testSelect.style.borderColor = '#e1e4e8';
    }

    const testsConLateralidad = ["SLR", "ANKLE", "DJ"];
    if (testsConLateralidad.includes(testSelect.value) && (!lateralidadSelect.value || lateralidadSelect.value === "")) {
      lateralidadSelect.style.borderColor = '#FF0000';
      alert("Comprueba los campos obligatorios");
      isValid = false;
    } else {
      lateralidadSelect.style.borderColor = '#e1e4e8';
    }

    if (isValid && nombreUsuario) {
      const nombreHoja = localStorage.getItem('NombreHoja') || "VisualizacionTEST";
      await consultarGoogleSheet(nombreHoja, nombreUsuario, testSelect.value, lateralidadSelect.value);
    } else if (!nombreUsuario) {
      alert("No se encontró el usuario en el almacenamiento local.");
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
        campo2.value = formatearFecha(fila[4]);
        campo3.value = fila[5] || "";
        campo4.value = formatearFecha(fila[6]);
      } else if (combinacionTest === "SLRDCH") {
        campo1.value = fila[7] || "";
        campo2.value = formatearFecha(fila[8]);
        campo3.value = fila[9] || "";
        campo4.value = formatearFecha(fila[10]);
      } else if (testSeleccionado === "CMJ") {
        campo1.value = fila[11] || "";
        campo2.value = formatearFecha(fila[12]);
        campo3.value = fila[13] || "";
        campo4.value = formatearFecha(fila[14]);
      } 
      // Puedes seguir añadiendo más condiciones 'else if' para el resto de tus tests (SJ, 30-15, PESO, etc.)
    }
  } catch (error) {
    console.error("Error al obtener los datos de la hoja:", error);
  }
}
