document.addEventListener("DOMContentLoaded", () => {

  // 1. Fecha actual
  const fechaInput = document.getElementById("SelectorDeFecha1");
  const today = new Date().toISOString().split("T")[0];
  fechaInput.value = today;

  // 2. Datos de localStorage (con recuperación flexible)
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

  // 3. Carpetas de Google Drive
  function obtenerFolderId(equipo, entrenamiento) {
    if (entrenamiento === "Pista" && equipo === "EBA") return "1-7UDm_-m7CqnqDhYfCjzT8WF57KRCSJT";
    if (entrenamiento === "Físico" && equipo === "EBA") return "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ";
    if (entrenamiento === "Pista" && equipo === "Junior A") return "1popWCqp2NRuGDHPlqGUGavYzCjHof4d";
    if (entrenamiento === "Físico" && equipo === "Junior A") return "17KMZF1tKwZyZB5fg2lPndVN0F8g1jSle";
    if (entrenamiento === "Pista" && equipo === "Junior B") return "1N9I0FKZ3Bp4W6_F7TfeyT38cEggXEZRI";
    if (entrenamiento === "Físico" && equipo === "Junior B") return "1yPuV6bwl48glTw0AHJP3MA7YEhq2R8Gv";
    if (entrenamiento === "Pista" && equipo === "Cadete A") return "1LgRPFVcke8UKHbqoyi5yYLmCq4rucHZ2";
    if (entrenamiento === "Físico" && equipo === "Cadete A") return "1ChuJ-F3JeKkoshtnKlWqgluWVFnY1vjB";
    if (entrenamiento === "Pista" && equipo === "Cadete B") return "18EANG_Wv3W6jgxkGe55YK8OgTsZly319";
    if (entrenamiento === "Físico" && equipo === "Cadete B") return "1_KgcdJe-T4MTfpqJyp9VZ9YyFyGsx4Xa";
    if (entrenamiento === "Pista" && equipo === "Infantil A") return "1PhY2dTw98_uVder7BzUXdLU5eT9lu_8P";
    if (entrenamiento === "Físico" && equipo === "Infantil A") return "1M1JubcwUhsJoww0f0BP8bakjHzR4vK2A";
    if (entrenamiento === "Pista" && equipo === "Infantil B") return "1EpMEXq2EYBcRucK8mk4SIRR2BQfBNyq";
    if (entrenamiento === "Físico" && equipo === "Infantil B") return "1G44Nviyut4CTPelgjxhKCGCI183ZJ";
    return "";
  }

  // 4. Cámara / imagen
  const btnFoto = document.getElementById("Foto");
  const inputFileFoto = document.getElementById("inputFileFoto");
  const imagen1 = document.getElementById("Imagen1");

  let imagenBase64 = "";

  btnFoto.addEventListener("click", () => {
    inputFileFoto.click();
  });

  inputFileFoto.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (uploadEvent) {
      const img = new Image();
      img.src = uploadEvent.target.result;
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        imagenBase64 = canvas.toDataURL("image/jpeg", 0.7);
        imagen1.src = imagenBase64;
        imagen1.style.display = "block";
      };
    };
    reader.readAsDataURL(file);
  });

  // 5. Enviar (Con modo depuración para capturar el error de la foto)
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
    const folderId = obtenerFolderId(equipoActual, tipoActual);

    if (!folderId) {
      alert("No se ha encontrado la carpeta de Drive.");
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Subiendo...";

    try {
      // Envío a Google Forms
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

      // Envío de la imagen con captura de errores en consola
      if (imagenBase64) {
        const scriptURL = "https://script.google.com/macros/s/AKfycbwhkC91Cu2-swtzov5hC7NCNbSBJFahtGXBl-eLpvAjQA5k9sMtXcbtMLCkFFsb5_S8bg/exec";
        const base64Clean = imagenBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
        const fileName = `${equipoActual}-${fechaInput.value}.jpg`;

        console.log("📤 Intentando enviar imagen a Apps Script...");

        const datos =
          "filename=" + encodeURIComponent(fileName) +
          "&folderId=" + encodeURIComponent(folderId) +
          "&mimetype=" + encodeURIComponent("image/jpeg") +
          "&data=" + encodeURIComponent(base64Clean);

        try {
          const respuesta = await fetch(scriptURL, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: datos
          });

          const resultadoTexto = await respuesta.text();
          console.log("📥 Respuesta recibida del Apps Script:", resultadoTexto);
        } catch (errRed) {
          console.error("❌ Error de red o CORS al contactar con Apps Script:", errRed);
        }
      }

      // 🛑 MODO PRUEBA ACTIVO: La página NO cambia de sitio para que veas la consola
      console.log("🏁 Fin del proceso. Revisa si ha salido algún error rojo en la consola.");
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Subir sesión";

    } catch (error) {
      console.error("❌ Error general:", error);
      alert("Hubo un error al subir la sesión.");
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Subir sesión";
    }
  });

  // 6. Menú
  const btnMenu = document.getElementById("Menú");
  btnMenu.addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });

});
