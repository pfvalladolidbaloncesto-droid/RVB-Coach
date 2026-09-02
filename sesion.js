document.addEventListener("DOMContentLoaded", () => {
  // 1. Inicialización de fecha actual (YYYY-MM-DD)
  const fechaInput = document.getElementById("SelectorDeFecha1");
  const today = new Date().toISOString().split('T')[0];
  fechaInput.value = today;

  // 2. Recuperar datos de localStorage
  const entrenamientoInput = document.getElementById("Entrenamiento1");
  const equipoInput = document.getElementById("Equipo");
  const duracionInput = document.getElementById("Duracion");

  const equipoGuardado = localStorage.getItem("Equipo") || "";
  const tipoEntrenamiento = localStorage.getItem("TipoEntrenamiento") || "Físico";

  entrenamientoInput.value = tipoEntrenamiento;
  equipoInput.value = equipoGuardado;

  if (tipoEntrenamiento === "Físico") {
    duracionInput.value = 55;
  }

  // 3. Manejo de la cámara / archivo (Opcional)
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

  // 4. Matriz de carpetas de Google Drive
  const folderMapping = {
    "EBA": { "Pista": "1-7UDm_-m7CqnqDhYfCjzT8WF57KRCSJT", "Físico": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ" },
  };

  // 5. Validación y Envío
  const btnEnviar = document.getElementById("Enviar");
  btnEnviar.addEventListener("click", () => {
    // Validar solo los campos de texto obligatorios (la foto ya no es obligatoria)
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

    if (!valido) {
      alert("Comprueba campos obligatorios");
      return;
    }

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

    // Envío de la imagen a Google Apps Script (solo si se ha seleccionado una foto)
    if (imagenBase64) {
      const scriptURL = "https://script.google.com/macros/s/AKfycbwhkC91Cu2-swtzov5hC7NCNbSBJFahtGXBl-eLpvAjQA5k9sMtXcbtMLCkFFsb5_S8bg/exec";
      const payload = {
        base64Data: imagenBase64,
        fileName: `${equipoActual}-${fechaInput.value}.jpg`,
        folderId: folderId,
        mimeType: "image/jpeg"
      };

      // Se usa no-cors para evitar el error de bloqueo del navegador con Google Apps Script
      fetch(scriptURL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      }).catch(error => console.error("Error al subir la imagen:", error));
    }

    // Notificación de éxito y redirección
    alert("Sesión subida con éxito");
    window.location.href = "menu_principal.html";
  });

  // 6. Botón Menú Principal
  const btnMenu = document.getElementById("Menú");
  btnMenu.addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });
});
