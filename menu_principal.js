document.addEventListener("DOMContentLoaded", () => {
  const etiquetaUsuario = document.getElementById("etiquetaUsuario");
  const selectorRol = document.getElementById("selectorRol");
  const selectorEquipo = document.getElementById("selectorEquipo");

  // Botones
  const btnReadiness = document.getElementById("btnReadiness");
  const btnRPE = document.getElementById("btnRPE");
  const btnRegistrarTest = document.getElementById("btnRegistrarTest");
  const btnConsultarTest = document.getElementById("btnConsultarTest");
  const btnSesion = document.getElementById("btnSesion");
  const btnCargaEquipo = document.getElementById("btnCargaEquipo");
  const btnCargaJugador = document.getElementById("btnCargaJugador");
  const btnLesion = document.getElementById("btnLesion");
  const btnLogOut = document.getElementById("btnLogOut");

  // === INITIALIZE ===
  // 1. Extraer usuario
  const urlParams = new URLSearchParams(window.location.search);
  let usuario = urlParams.get("startValue") || localStorage.getItem("Usuario") || "Usuario";
  
  etiquetaUsuario.textContent = usuario;
  localStorage.setItem("Usuario", usuario);

  // 2. Preseleccionar Rol por defecto si existe
  const rolDefecto = localStorage.getItem("RolPorDefecto");
  if (rolDefecto) {
    if (rolDefecto.toUpperCase().includes("FISICO") || rolDefecto.toUpperCase().includes("PF")) {
      selectorRol.value = "PF";
    } else if (rolDefecto.toUpperCase().includes("PISTA") || rolDefecto.toUpperCase().includes("ENTRENADOR")) {
      selectorRol.value = "Entrenador";
    } else {
      selectorRol.value = rolDefecto;
    }
  }

  // 3. Preseleccionar Equipo por defecto
  const equipoDefecto = localStorage.getItem("equipo") || localStorage.getItem("EquipoPorDefecto") || localStorage.getItem("Equipo");
  if (equipoDefecto) {
    // Busca coincidencia sin importar mayúsculas/minúsculas
    const opciones = Array.from(selectorEquipo.options);
    const opcionEncontrada = opciones.find(opt => opt.value.toUpperCase() === equipoDefecto.toUpperCase());
    if (opcionEncontrada) {
      selectorEquipo.value = opcionEncontrada.value;
    }
  }

  // 4. Guardar lista por defecto de Tests
  const listaTests = ["SLR", "ANKLE", "PESO", "30-15", "DJ", "CMJ", "ALTURA", "ENVERGADURA"];
  localStorage.setItem("Test", JSON.stringify(listaTests));

  // Función auxiliar para guardar selección de Equipo y Navegar
  function guardarYRedirigir(variableNombre, pantallaDestino) {
    const equipoSeleccionado = selectorEquipo.value;
    
    // Guardamos en todas las variaciones de clave para asegurar compatibilidad total
    localStorage.setItem("equipo", equipoSeleccionado);
    localStorage.setItem("Equipo", equipoSeleccionado);
    localStorage.setItem("equipoUsuario", equipoSeleccionado);
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
    const rolSeleccionado = selectorRol.value;
    
    if (rolSeleccionado === "PF") {
      localStorage.setItem("Rol", "Físico");
    } else if (rolSeleccionado === "Entrenador") {
      localStorage.setItem("Rol", "Pista");
    }

    guardarYRedirigir("Sesión", "sesion.html");
  });

  btnLesion.addEventListener("click", () => {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLScLzsu7Ta7AZL7fojMHBcDcMAqpLKMrCHoHuftQUdOOpvlYZQ/viewform?usp=sf_link", "_blank");
  });

  btnLogOut.addEventListener("click", () => {
    window.location.href = "index.html";
  });
});
