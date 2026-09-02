document.addEventListener("DOMContentLoaded", () => {

  const fechaInput = document.getElementById("SelectorDeFecha1");
  const today = new Date().toISOString().split("T")[0];
  fechaInput.value = today;

  const entrenamientoInput = document.getElementById("Entrenamiento1");
  const equipoInput = document.getElementById("Equipo");
  const duracionInput = document.getElementById("Duracion");

  const equipoGuardado = localStorage.getItem("Equipo") || localStorage.getItem("equipo") || localStorage.getItem("EquipoSeleccionado") || "Junior A";
  const tipoEntrenamiento = localStorage.getItem("TipoEntrenamiento") || localStorage.getItem("tipoEntrenamiento") || localStorage.getItem("entrenamiento") || "Físico";

  entrenamientoInput.value = tipoEntrenamiento;
  equipoInput.value = equipoGuardado;

  if (tipoEntrenamiento === "Físico" || !duracionInput.value) {
    duracionInput.value = 55;
  }

  const btnFoto = document.getElementById("Foto");
  const inputFileFoto = document.getElementById("inputFileFoto");
  const imagen1 = document.getElementById("Imagen1");

  let archivoSeleccionado = null;

  btnFoto.addEventListener("click", () => {
    inputFileFoto.click();
  });

  inputFileFoto.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    archivoSeleccionado = file;

    const reader = new FileReader();
    reader.onload = function (uploadEvent) {
      imagen1.src = uploadEvent.target.result;
      imagen1.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  const btnEnviar = document.getElementById("Enviar");

  btnEnviar.addEventListener("click", async () => {
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

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Subiendo...";

    try {
      // 1. Envío de datos de texto a Google Forms
      const formData = new URLSearchParams();
      formData.append("entry.279691575", fechaInput.value);
      formData.append("entry.1010684221", equipoActual);
      formData.append("entry.1004271819", tipoActual);
      formData.append("entry.152725020", duracionInput.value);

      await fetch("https://docs.google.com/forms/d/1OsUlDQwOkJHkD8w8gIqERg4oP4FulmRmcAx_WoeMs4Y/formResponse", {
        method: "POST",
        mode: "no-cors",
        body: formData
      });
      console.log("✅ Datos enviados a Google Forms correctamente.");

      // 2. Si hay foto, la enviamos a Google Drive mediante el formulario oculto estilo Kio
      if (archivoSeleccionado) {
        console.log("📤 Enviando foto a Google Drive...");
        
        const reader = new FileReader();
        reader.onload = function(e) {
          const base64Completo = e.target.result;
          const base64Puro = base64Completo.split(',')[1];
          
          document.getElementById("inputDataImg").value = base64Puro;
          document.getElementById("inputFilename").value = "sesion_" + fechaInput.value + "_" + equipoActual + ".jpg";
          document.getElementById("inputMimetype").value = archivoSeleccionado.type;
          
          // Disparamos el envío del formulario oculto al Apps Script
          document.getElementById("formOcultoDrive").submit();
          console.log("✅ Imagen enviada al script de Google Drive.");
        };
        reader.readAsDataURL(archivoSeleccionado);
      }

      alert("¡Sesión subida correctamente!");

      btnEnviar.disabled = false;
      btnEnviar.textContent = "Subir sesión";

    } catch (error) {
      console.error("❌ Error general:", error);
      alert("Hubo un error al subir la sesión.");
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Subir sesión";
    }
  });

  const btnMenu = document.getElementById("Menú");
  btnMenu.addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });

});
