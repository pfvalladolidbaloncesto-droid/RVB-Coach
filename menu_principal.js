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
  // 1. Extraer usuario de la URL o LocalStorage
  const urlParams = new URLSearchParams(window.location.search);
  let usuario = urlParams.get("startValue") || localStorage.getItem("Usuario") || "Usuario";
  
  etiquetaUsuario.textContent = usuario;
  localStorage.setItem("Usuario", usuario);

  // 2. Guardar lista por defecto de Tests en LocalStorage (Equivalente al bloque Test)
  const listaTests = ["SLR", "ANKLE", "PESO", "30-15", "DJ", "CMJ", "ALTURA", "ENVERGADURA"];
  localStorage.setItem("Test", JSON.stringify(listaTests));

  // Función auxiliar para guardar selección de Equipo y Navegar
  function guardarYRedirigir(variableNombre, pantallaDestino) {
    const equipoSeleccionado = selectorEquipo.value;
    localStorage.setItem("Equipo", equipoSeleccionado);
    localStorage.setItem("Variable", variableNombre);
    window.location.href = pantallaDestino;
  }

  // === EVENTOS DE BOTONES ===

  // Readiness
  btnReadiness.addEventListener("click", () => {
    guardarYRedirigir("Readiness", "selector.html");
  });

  // RPE
  btnRPE.addEventListener("click", () => {
    guardarYRedirigir("RPE", "selector.html");
  });

  // Registrar tests
  btnRegistrarTest.addEventListener("click", () => {
    guardarYRedirigir("Registrar test", "selector.html");
  });

  // Consultar test
  btnConsultarTest.addEventListener("click", () => {
    guardarYRedirigir("Consultar test", "selector.html");
  });

  // Carga Equipo
  btnCargaEquipo.addEventListener("click", () => {
    guardarYRedirigir("Carga Equipo", "carga.html");
  });

  // Carga Jugador
  btnCargaJugador.addEventListener("click", () => {
    guardarYRedirigir("Carga Jugador", "selector.html");
  });

  // Subir sesión
  btnSesion.addEventListener("click", () => {
    const rolSeleccionado = selectorRol.value;
    
    // Guardar Rol específico según la lógica de App Inventor
    if (rolSeleccionado === "PF") {
      localStorage.setItem("Rol", "Físico");
    } else if (rolSeleccionado === "Entrenador") {
      localStorage.setItem("Rol", "Pista");
    }

    guardarYRedirigir("Sesión", "sesion.html");
  });

  // Registrar lesión (Abre Google Form)
  btnLesion.addEventListener("click", () => {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLScLzsu7Ta7AZL7fojMHBcDcMAqpLKMrCHoHuftQUdOOpvlYZQ/viewform?usp=sf_link", "_blank");
  });

  // Cerrar Sesión
  btnLogOut.addEventListener("click", () => {
    window.location.href = "index.html";
  });
});
