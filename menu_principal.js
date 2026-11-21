document.addEventListener("DOMContentLoaded", () => {
  const etiquetaUsuario = document.getElementById("etiquetaUsuario");
  const selectorRol = document.getElementById("selectorRol");
  const selectorEquipo = document.getElementById("selectorEquipo");

  // Botones
  const btnReadiness = document.getElementById("btnReadiness");
  const btnRPE = document.getElementById("btnRPE");
  const btnRpePartido = document.getElementById("btnRpePartido");
  const btnRegistrarTest = document.getElementById("btnRegistrarTest");
  const btnConsultarTest = document.getElementById("btnConsultarTest");
  const btnSesion = document.getElementById("btnSesion");
  const btnSesionesEquipo = document.getElementById("btnSesionesEquipo");
  const btnSesionesJugador = document.getElementById("btnSesionesJugador");
  const btnCargaEquipo = document.getElementById("btnCargaEquipo");
  const btnCargaJugador = document.getElementById("btnCargaJugador");
  const btnLesion = document.getElementById("btnLesion");
  const btnFinalizarLesion = document.getElementById("btnFinalizarLesion");
  const btnCambiarContrasena = document.getElementById("btnCambiarContrasena");
  const btnLogOut = document.getElementById("btnLogOut");

  // === INITIALIZE ===
  // 1. Extraer usuario
  const sesion = JSON.parse(sessionStorage.getItem("rvb_coach_sesion") || "null");
  let usuario = sesion?.usuario || "Usuario";
  
  etiquetaUsuario.textContent = usuario;
  // La identidad del entrenador procede de la sesión validada en el servidor.

  // 2. Preseleccionar Rol por defecto (normalizado a rolUsuario)
  const rolDefecto = localStorage.getItem("rolUsuario") || localStorage.getItem("RolPorDefecto");
  if (rolDefecto) {
    if (rolDefecto.toUpperCase().includes("FISICO") || rolDefecto.toUpperCase().includes("PF")) {
      selectorRol.value = "PF";
    } else if (rolDefecto.toUpperCase().includes("PISTA") || rolDefecto.toUpperCase().includes("ENTRENADOR")) {
      selectorRol.value = "Entrenador";
    } else {
      selectorRol.value = rolDefecto;
    }
  }
  localStorage.setItem("rolUsuario", selectorRol.value);

  // 3. Preseleccionar Equipo por defecto (normalizado a equipoUsuario)
  const equipoDefecto = localStorage.getItem("equipoUsuario") || localStorage.getItem("EquipoPorDefecto");
  if (equipoDefecto) {
    const opciones = Array.from(selectorEquipo.options);
    const opcionEncontrada = opciones.find(opt => opt.value.toUpperCase() === equipoDefecto.toUpperCase());
    if (opcionEncontrada) {
      selectorEquipo.value = opcionEncontrada.value;
    }
  }
  localStorage.setItem("equipoUsuario", selectorEquipo.value);

  // 4. Guardar lista por defecto de Tests
  const listaTests = ["SLR", "ANKLE", "PESO", "30-15", "DJ", "CMJ", "ALTURA", "ENVERGADURA"];
  localStorage.setItem("Test", JSON.stringify(listaTests));

  // Función para gestionar la visibilidad del botón RPE partido
  function actualizarVisibilidadRpePartido() {
    if (selectorRol.value === "PF") {
      btnRpePartido.style.display = "block";
    } else {
      btnRpePartido.style.display = "none";
    }
  }

  // Ejecutar al cargar y al cambiar el rol
  actualizarVisibilidadRpePartido();
  selectorRol.addEventListener("change", () => {
    actualizarVisibilidadRpePartido();
    localStorage.setItem("rolUsuario", selectorRol.value);
  });

  // Función auxiliar para guardar selección normalizada y Navegar
  function guardarYRedirigir(variableNombre, pantallaDestino) {
    const equipoSeleccionado = selectorEquipo.value;
    const rolSeleccionado = selectorRol.value;

    localStorage.setItem("Equipo", equipoSeleccionado);
    
    let rolFinal = rolSeleccionado;
    if (rolSeleccionado === "PF") {
      rolFinal = "Físico";
    } else if (rolSeleccionado === "Entrenador") {
      rolFinal = "Pista";
    }
    localStorage.setItem("Rol", rolFinal);

    localStorage.setItem("Variable", variableNombre);
    
    window.location.href = pantallaDestino;
  }

  // === EVENTOS DE BOTONES ===

  btnReadiness.addEventListener("click", () => {
    guardarYRedirigir("Readiness", "selector.html");
  });

  btnRPE.addEventListener("click", () => {
    guardarYRedirigir("RPE", "selector.html");
  });

  btnRpePartido.addEventListener("click", () => {
    guardarYRedirigir("RPE Partido", "RpePartido.html");
  });

  btnRegistrarTest.addEventListener("click", () => {
    guardarYRedirigir("Registrar test", "selector.html");
  });

  btnConsultarTest.addEventListener("click", () => {
    guardarYRedirigir("Consultar test", "selector.html");
  });

  btnCargaEquipo.addEventListener("click", () => {
    guardarYRedirigir("Carga Equipo", "carga.html");
  });

  btnCargaJugador.addEventListener("click", () => {
    guardarYRedirigir("Carga Jugador", "selector.html");
  });

  btnSesion.addEventListener("click", () => {
    guardarYRedirigir("Sesión", "sesion.html");
  });

  btnSesionesEquipo.addEventListener("click", () => {
    guardarYRedirigir("Sesiones Equipo", "sesiones_consulta.html?modo=equipo");
  });

  btnSesionesJugador.addEventListener("click", () => {
    guardarYRedirigir("Sesiones Jugador", "selector.html");
  });

  btnLesion.addEventListener("click", () => {
    guardarYRedirigir("Registrar lesión", "selector.html");
  });

  btnFinalizarLesion.addEventListener("click", () => {
    guardarYRedirigir("Finalizar lesión", "finalizar_lesion.html");
  });

  btnCambiarContrasena.addEventListener("click", () => {
    // Este cambio usa el usuario autenticado, no el jugador ni el equipo.
    window.location.href = "cambiar_contrasena.html";
  });

  btnLogOut.addEventListener("click", () => {
    const datos = JSON.parse(sessionStorage.getItem("rvb_coach_sesion") || "null");
    sessionStorage.removeItem("rvb_coach_sesion");
    localStorage.removeItem("User");
    localStorage.removeItem("jugadorSeleccionado");
    localStorage.removeItem("Variable");
    localStorage.removeItem("Password");
    if (datos?.token && navigator.sendBeacon) {
      navigator.sendBeacon("https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec", new URLSearchParams({
        accion: "cerrarSesion", token: datos.token
      }));
    }
    if (localStorage.getItem("Recuerdame") !== "true") {
      localStorage.removeItem("Usuario");
    }
    window.location.replace("index.html");
  });
});
