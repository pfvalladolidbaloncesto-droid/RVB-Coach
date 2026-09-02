document.addEventListener("DOMContentLoaded", () => {

  const fechaInput = document.getElementById("SelectorDeFecha1");
  const today = new Date().toISOString().split("T")[0];
  fechaInput.value = today;

  const entrenamientoInput = document.getElementById("Entrenamiento1");
  const equipoInput = document.getElementById("Equipo");
  const duracionInput = document.getElementById("Duracion");

  const equipoGuardado = localStorage.getItem("Equipo") || localStorage.getItem("equipo") || localStorage.getItem("EquipoSeleccionado") || "Junior A";
  const rolGuardado = localStorage.getItem("Rol") || localStorage.getItem("rol") || localStorage.getItem("tipoRol") || "";

  // Determinamos el entrenamiento según el rol del menú principal
  let tipoEntrenamiento = "Físico"; // Valor por defecto
  if (rolGuardado.toUpperCase() === "PF") {
    tipoEntrenamiento = "Físico";
  } else if (rolGuardado.toLowerCase().includes("Entrenador") || rolGuardado.toLowerCase() === "coach") {
    tipoEntrenamiento = "Pista";
  } else {
    // Si no viene del rol, intentamos leerlo del localStorage directo
    tipoEntrenamiento = localStorage.getItem("TipoEntrenamiento") || localStorage.getItem("tipoEntrenamiento") || localStorage.getItem("entrenamiento") || "Físico";
  }

  document.getElementById("Equipo").value = equipoGuardado.trim();
  document.getElementById("Entrenamiento1").value = tipoEntrenamiento.trim();

  if (tipoEntrenamiento.includes("Físico") || tipoEntrenamiento.includes("Fisico") || !duracionInput.value) {
    duracionInput.value = 55;
  }

  // Diccionario exacto de IDs de Google Drive sin errores de sintaxis
  const carpetasDriveIDs = {
    "EBA_Pista": "1-7UDm_-m7CqnqDhYfCjzT8WF57KRCSJT",
    "EBA_Físico": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ",
    "EBA_Fisico": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ",
    "Junior A_Pista": "1popwCXqp2NRuGDHPLqGUGavYZcjHoF4d",
    "Junior A_Físico": "17KMZF1tKwZYZB5fg2lpNdVN0F8g1jSle",
    "Junior A_Fisico": "17KMZF1tKwZYZB5fg2lpNdVN0F8g1jSle",
    "Junior B_Pista": "1N9l0FKZ3Bp4W8_F7TfEyT38cEggXEZRl",
    "Junior B_Físico": "1yPuV6bwl46gITw0AHJP3MA7YEhq2R8Gv",
    "Junior B_Fisico": "1yPuV6bwl46gITw0AHJP3MA7YEhq2R8Gv",
    "Cadete A_Pista": "1LgRPFVcKe8UKHbqoyi5yYLmCq4rucHz2",
    "Cadete A_Físico": "1cHUj-F3JeKkoshtnKtWqgIuWVFnY1vjB",
    "Cadete A_Fisico": "1cHUj-F3JeKkoshtnKtWqgIuWVFnY1vjB",
    "Cadete B_Pista": "18EANg_Wv3W8jgxkGe55Yk8OgTsZly319",
    "Cadete B_Físico": "1_KgcdJe-T4MtFpqJyp9VZ9YyFygSx4Xa",
    "Cadete B_Fisico": "1_KgcdJe-T4MtFpqJyp9VZ9YyFygSx4Xa",
    "Infantil A_Pista": "1PhY2dTw98_uVder7BzUXdLU5eT9Iu_8P",
    "Infantil A_Físico": "1M1JUbcwUhsJoww0f0BPs8akjHZr4vK2A",
    "Infantil A_Fisico": "1M1JUbcwUhsJoww0f0BPs8akjHZr4vK2A",
    "Infantil B_Pista": "1ePmEXq2EYBcrUoKBmk4SIRRr2BQFbNyq",
    "Infantil B_Físico": "1G44NviyutQ4CTPelgjxtHSKCGCI183ZJ",
    "Infantil B_Fisico": "1G44NviyutQ4CTPelgjxtHSKCGCI183ZJ"
  };

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

    const equipoActual = equipoInput.value.trim();
    const tipoActual = entrenamientoInput.value.trim();

    const claveBusqueda = `${equipoActual}_${tipoActual}`;
    const idCarpetaSeleccionada = carpetasDriveIDs[claveBusqueda];

    if (!idCarpetaSeleccionada) {
      alert(`⚠️ Error de configuración: No existe una carpeta asociada para Equipo: "${equipoActual}" y Entrenamiento: "${tipoActual}". Revisa la consola.`);
      console.error("Claves disponibles:", Object.keys(carpetasDriveIDs));
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Subiendo...";

    try {
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

      if (archivoSeleccionado) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const base64Completo = e.target.result;
          const base64Puro = base64Completo.split(',')[1];
          
          document.getElementById("inputDataImg").value = base64Puro;
          document.getElementById("inputFilename").value = `${equipoActual}-${fechaInput.value}.jpg`;
          document.getElementById("inputMimetype").value = archivoSeleccionado.type;
          document.getElementById("inputFolderId").value = idCarpetaSeleccionada;
          
          document.getElementById("formOcultoDrive").submit();
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
