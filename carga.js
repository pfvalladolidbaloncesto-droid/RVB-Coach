<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Carga - Coach RVB</title>
  
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#ffffff" />
  
  <link rel="stylesheet" href="style.css?v=3" />
  <script src="carga.js?v=3" defer></script>
</head>
<body>
  <div class="main-container menu-container">
    <header class="user-header">
      <span id="etiquetaTitulo" class="user-name">Cargando...</span>
    </header>

    <main class="menu-content">
      <!-- Selección de Equipo -->
      <div class="form-group">
        <label for="selectorEquipoCarga">Equipo</label>
        <select id="selectorEquipoCarga">
          <option value="Infantil B">Infantil B</option>
          <option value="Infantil A">Infantil A</option>
          <option value="Cadete B">Cadete B</option>
          <option value="Cadete A">Cadete A</option>
          <option value="Junior B">Junior B</option>
          <option value="Junior A">Junior A</option>
          <option value="Tercera">Tercera</option>
        </select>
      </div>

      <!-- Campo de texto para Usuario (Solo visible si es Carga Jugador) -->
      <div class="form-group" id="grupoTextBox">
        <label for="inputUsuarioCarga">Jugador / Usuario</label>
        <input type="text" id="inputUsuarioCarga" class="input-text" placeholder="Nombre de usuario" />
      </div>

      <!-- Selector de Fecha -->
      <div class="form-group">
        <label for="inputFecha">Fecha</label>
        <input type="date" id="inputFecha" class="input-date" />
      </div>

      <!-- Botón de Enviar -->
      <button id="btnEnviarCarga" class="btn-action">Enviar</button>

      <!-- Botón para volver atrás -->
      <button id="btnVolverMenu" class="btn-logout" style="margin-top: 15px; background-color: #6c757d;">Volver al Menú</button>
    </main>
  </div>
</body>
</html>
