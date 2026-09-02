document.addEventListener("DOMContentLoaded", () => {
  const etiquetaTitulo = document.getElementById("etiquetaTitulo");
  const selectorEquipoCarga = document.getElementById("selectorEquipoCarga");
  const inputUsuarioCarga = document.getElementById("inputUsuarioCarga");
  const grupoTextBox = document.getElementById("grupoTextBox");
  const inputFecha = document.getElementById("inputFecha");
  const btnEnviarCarga = document.getElementById("btnEnviarCarga");
  const btnVolverMenu = document.getElementById("btnVolverMenu");

  // 1. Recuperar variables del localStorage guardadas en el menú principal
  const variableActual = localStorage.getItem("Variable") || ""; // "Carga Jugador" o "Carga Equipo"
  const equipoGuardado = localStorage.getItem("Equipo") || "";
  const usuarioGuardado = localStorage.getItem("Usuario") || "";

  // Cambiar el título superior según lo que se esté haciendo
  etiquetaTitulo.textContent = variableActual;

  // 2. Preseleccionar el equipo si ya venía guardado
  if (equipoGuardado) {
    const opciones = Array.from(selectorEquipoCarga.options);
    const encontrada = opciones.find(opt => opt.value.toUpperCase() === equipoGuardado.toUpperCase());
    if (encontrada) {
      selectorEquipoCarga.value = encontrada.value;
    }
  }

  // 3. Configurar fecha actual por defecto (YYYY-MM-DD para inputs de tipo date)
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  inputFecha.value = `${year}-${month}-${day}`;

  // 4. Adaptar visibilidad según sea "Carga Jugador" o "Carga Equipo"
  if (variableActual === "Carga Jugador") {
    grupoTextBox.style.display = "block";
    inputUsuarioCarga.value = usuarioGuardado;
  } else {
    // Si es Carga Equipo, ocultamos el campo de texto extra
    grupoTextBox.style.display = "none";
  }

  // 5. Lógica del Botón Enviar
  btnEnviarCarga.addEventListener("click", async () => {
    const equipoSeleccionado = selectorEquipoCarga.value;
    const fechaSeleccionada = inputFecha.value; // Formato YYYY-MM-DD
    const textoUsuario = inputUsuarioCarga.value;

    // Convertir la fecha a formato DD/MM/YYYY para que coincida con tu Apps Script original
    const partesFecha = fechaSeleccionada.split("-");
    const fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;

    if (!equipoSeleccionado || !fechaSeleccionada) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    let urlWeb = "";

    if (variableActual === "Carga Jugador") {
      if (!textoUsuario) {
        alert("Introduce el nombre del jugador.");
        return;
      }
      // URL de Apps Script para Carga Jugador
      urlWeb = `https://script.google.com/macros/s/AKfycbwXRzLttUWIv82OeF1OI2UU06EADWvwBtcFKbck-fkdXesMKLTZUHbhrT9sP_40HhMexA/exec?textbox1=${encodeURIComponent(equipoSeleccionado)}&textbox2=${encodeURIComponent(textoUsuario)}&textbox3=${encodeURIComponent(fechaFormateada)}`;
    } 
    else if (variableActual === "Carga Equipo") {
      // URL de Apps Script para Carga Equipo
      urlWeb = `https://script.google.com/macros/s/AKfycbzo9bH1BVAQ8pP0qBx6_m1AbfrxjljYaxTRPGXxe4wvaw8HJ7LTvL9dAn7Ie24K_Xlw3Q/exec?nuevoValorB9=${encodeURIComponent(equipoSeleccionado)}&nuevoValorB10=${encodeURIComponent(fechaFormateada)}`;
    }

    if (!urlWeb) {
      alert("Acción no válida.");
      return;
    }

    try {
      btnEnviarCarga.textContent = "Enviando...";
      btnEnviarCarga.disabled = true;

      // Hacemos la petición GET al Web App de Google
      await fetch(urlWeb);
      
      // Abrimos el PDF correspondiente en otra pestaña de forma limpia y correcta
      let urlPdf = "";
      if (variableActual === "Carga Jugador") {
        urlPdf = "https://docs.google.com/spreadsheets/d/1waAXuyLOYY7yp0WQzv17OTOPvcZ4uvuhKGkp1YdlOrQ/export?format=pdf&gid=1857963185&range=E1:S110&size=A4&portrait=true&fitw=true&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5";
      } else {
        urlPdf = "https://docs.google.com/spreadsheets/d/1waAXuyLOYY7yp0WQzv17OTOPvcZ4uvuhKGkp1YdlOrQ/export?format=pdf&gid=1855641404&range=A1:Q208&size=A4&portrait=true&fitw=true&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5";
      }

      window.open(urlPdf, "_blank");

    } catch (error) {
      console.error("Error al enviar los datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      btnEnviarCarga.textContent = "Enviar";
      btnEnviarCarga.disabled = false;
    }
  });

  // Botón Volver
  btnVolverMenu.addEventListener("click", () => {
    window.location.href = "menu_principal.html";
  });
});
