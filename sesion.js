document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicialización de fecha actual (YYYY-MM-DD)
  const fechaInput = document.getElementById("SelectorDeFecha1");
  const today = new Date().toISOString().split('T')[0];
  fechaInput.value = today;

  // 2. Recuperar datos de localStorage (simulando TinyBD)
  const entrenamientoInput = document.getElementById("Entrenamiento1");
  const equipoInput = document.getElementById("Equipo");
  const duracionInput = document.getElementById("Duracion");

  const rolGuardado = localStorage.getItem("Rol") || "";
  const equipoGuardado = localStorage.getItem("Equipo") || "";
  const tipoEntrenamiento = localStorage.getItem("TipoEntrenamiento") || "Físico"; // Ejemplo

  entrenamientoInput.value = tipoEntrenamiento;
  equipoInput.value = equipoGuardado;

  // Asignar duración por defecto si es Físico
  if (tipoEntrenamiento === "Físico") {
    duracionInput.value = 55;
  }

  // 3. Manejo de la cámara / archivo
  const btnFoto = document.getElementById("Foto");
  const inputFileFoto = document.getElementById("inputFileFoto");
  const imagen1 = document.getElementById("Imagen1");
  let imagenBase64 = "";

  btnFoto.addEventListener("click", () => {
    inputFileFoto.click();
  });

  inputFileFoto.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(uploadEvent) {
        imagenBase64 = uploadEvent.target.result;
        imagen1.src = imagenBase64;
        imagen1.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // 4. Matriz de carpetas de Google Drive según equipo y categoría
  const folderMapping = {
    "EBA": { "Pista": "1-7UDm_-m7CqnqDhYfCjzT8WF57KRCSJT", "Físico": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ" },
    // Añadir el resto de equipos aquí (Junior A, Junior B, etc.)
  };

  // 5. Validación y Envío
  const btnEnviar = document.getElementById("Enviar");
  btnEnviar.addEventListener("click", () => {
    // Validar campos obligatorios
    const campos = [fechaInput, entrenamientoInput, equipoInput, duracionInput];
    let valido = true;

    campos.forEach(campo => {
      if (!campo.value) {
        campo.style.backgroundColor = "#ff0000";
        valido = false;
      } else {
        campo.style.backgroundColor = "";
      }
    });

    if (!imagenBase64) {
      alert("Comprueba campos obligatorios o falta la foto.");
      valido = false;
    }

    if (!valido) {
      alert("Comprueba campos obligatorios");
      return;
    }

    // Obtener ID de carpeta correspondiente
    const equipoActual = equipoInput.value;
    const tipoActual = entrenamientoInput.value;
    const folderId = folderMapping[equipoActual]?.[tipoActual] || "ID_POR_DEFECTO";

    // Envío de datos de texto a Google Forms
    const formData = new URLSearchParams();
    formData.append("entry.279691575", fechaInput.value);
    formData.append("entry.1010684221", equipoActual);
    formData.append("entry.1004271819", tipoActual);
    formData.append("entry.152725020", duracionInput.value);

    fetch("https://docs.google.com/forms/d/1OsUlDQwOkJHkD8w8gIqERg4oP4FulmRmcAx_WoeMs4Y/formResponse", {
      method: "POST",
      mode: "no-cors",
      body: formData
    }).catch(err => console.error("Error en Google Form", err));

    // Envío de la imagen a Google Apps Script Web App
    const scriptURL = "https://script.google.com/macros/s/AKfycbwhkC91Cu2-swtzov5hC7NCNbSBJFahtGXBl-eLpvAjQA5k9sMtXcbtMLCkFFsb5_S8bg/exec";
    const payload = {
      base64Data: imagenBase64,
      fileName: `${equipoActual}-${fechaInput.value}.jpg`,
      folderId: folderId,
      mimeType: "image/jpeg"
    };

    fetch(scriptURL, {
      method: "POST",
      body: JSON.stringify(payload)
    })
    .then(response => response.text())
    .then(result => {
      alert("Sesión subida con éxito");
      window.location.href = "menu_principal.html";
    })
    .catch(error => {
      console.error("Error al subir la imagen:", error);
      alert("Error al subir la imagen");
    });
  });

  // 6. Botón Menú Principal
  const btnMenu = document.getElementById("Menú");
  btnMenu.addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });
});
