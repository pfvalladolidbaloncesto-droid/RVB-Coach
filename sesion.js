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



  // Mapeo dinámico de IDs de Google Drive según equipo y entrenamiento

  const carpetasDriveIDs = {

    "EBA_Pista": "1-7UDm_-m7CqnqDhYfCjzT8WF57KRCSJT"[cite: 3],

    "EBA_Físico": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ"[cite: 3],

    "Junior A_Pista": "1popwCXqp2NRuGDHPLqGUGavYZcjHoF4d"[cite: 3],

    "Junior A_Físico": "17KMZF1tKwZYZB5fg2lpNdVN0F8g1jSle"[cite: 3],

    "Junior B_Pista": "1N9l0FKZ3Bp4W8_F7TfEyT38cEggXEZRl"[cite: 3],

    "Junior B_Físico": "1yPuV6bwl46gITw0AHJP3MA7YEhq2R8Gv"[cite: 3],

    "Cadete A_Pista": "1LgRPFVcKe8UKHbqoyi5yYLmCq4rucHz2"[cite: 3],

    "Cadete A_Físico": "1cHUj-F3JeKkoshtnKtWqgIuWVFnY1vjB"[cite: 3],

    "Cadete B_Pista": "18EANg_Wv3W8jgxkGe55Yk8OgTsZly319"[cite: 3],

    "Cadete B_Físico": "1_KgcdJe-T4MtFpqJyp9VZ9YyFygSx4Xa"[cite: 3],

    "Infantil A_Pista": "1PhY2dTw98_uVder7BzUXdLU5eT9Iu_8P"[cite: 3],

    "Infantil A_Físico": "1M1JUbcwUhsJoww0f0BPs8akjHZr4vK2A"[cite: 3],

    "Infantil B_Pista": "1ePmEXq2EYBcrUoKBmk4SIRRr2BQFbNyq"[cite: 3],

    "Infantil B_Físico": "1G44NviyutQ4CTPelgjxtHSKCGCI183ZJ"[cite: 3]

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



      // 2. Si hay foto, seleccionamos su ID de carpeta correspondiente y la enviamos a Drive

      if (archivoSeleccionado) {

        console.log("📤 Enviando foto a Google Drive...");

        

        const claveBusqueda = `${equipoActual}_${tipoActual}`;

        const idCarpetaSeleccionada = carpetasDriveIDs[claveBusqueda] || "17KMZF1tKwZYZB5fg2lpNdVN0F8g1jSle"; // Fallback por defecto



        const reader = new FileReader();

        reader.onload = function(e) {

          const base64Completo = e.target.result;

          const base64Puro = base64Completo.split(',')[1];

          

          document.getElementById("inputDataImg").value = base64Puro;

          document.getElementById("inputFilename").value = "sesion_" + fechaInput.value + "_" + equipoActual + "_" + tipoActual + ".jpg";

          document.getElementById("inputMimetype").value = archivoSeleccionado.type;

          document.getElementById("inputFolderId").value = idCarpetaSeleccionada;

          

          // Disparamos el envío del formulario oculto al Apps Script

          document.getElementById("formOcultoDrive").submit();

          console.log("✅ Imagen enviada al script de Google Drive en la carpeta: " + idCarpetaSeleccionada);

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

