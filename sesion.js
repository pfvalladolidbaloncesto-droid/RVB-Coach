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

  // Capturamos el archivo directamente del input (asegúrate de tener <input type="file" id="inputFileFoto" style="display:none"> en tu HTML)
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

    archivoSeleccionado = file; // Guardamos el archivo físico real

    // Vista previa rápida en pantalla
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
      let urlImagenFinal = "";

      // 1. Si hay foto, la subimos a Cloudinary primero
      if (archivoSeleccionado) {
        console.log("📤 Subiendo foto a Cloudinary...");

        const dataCloudinary = new FormData();
        dataCloudinary.append("file", archivoSeleccionado);
        dataCloudinary.append("upload_preset", "entrenamientos_preset"); // <-- PON AQUÍ EL NOMBRE DE TU PRESET

        const responseCloudinary = await fetch("https://api.cloudinary.com/v1_1/clrq6e0m/image/upload", { // <-- PON AQUÍ EL NOMBRE DE TU NUBE
          method: "POST",
          body: dataCloudinary
        });

        if (!responseCloudinary.ok) {
          throw new Error("Error al subir la imagen a Cloudinary");
        }

        const jsonCloudinary = await responseCloudinary.json();
        urlImagenFinal = jsonCloudinary.secure_url; // ¡Esta es la URL pública y permanente de la foto!
        console.log("✅ Foto subida con éxito. URL:", urlImagenFinal);
      }

      // 2. Envío de datos a Google Forms (incluyendo la URL de la foto si quieres guardarla en el formulario)
      const formData = new URLSearchParams();
      formData.append("entry.279691575", fechaInput.value);
      formData.append("entry.1010684221", equipoActual);
      formData.append("entry.1004271819", tipoActual);
      formData.append("entry.152725020", duracionInput.value);
      
      // Si en tu Google Forms creas una pregunta de tipo texto corto para la "URL de la foto", 
      // puedes descomentar la siguiente línea poniendo el entry ID correspondiente:
      // formData.append("entry.A_AÑADIR_SI_QUIERES", urlImagenFinal);

      await fetch("https://docs.google.com/forms/d/1OsUlDQwOkJHkD8w8gIqERg4oP4FulmRmcAx_WoeMs4Y/formResponse", {
        method: "POST",
        mode: "no-cors",
        body: formData
      });

      console.log("✅ Datos enviados a Google Forms correctamente.");
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
