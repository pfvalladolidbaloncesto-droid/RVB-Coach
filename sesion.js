
document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  const fechaInput = $("SelectorDeFecha1");
  const entrenamientoInput = $("Entrenamiento1");
  const equipoInput = $("Equipo");
  const duracionInput = $("Duracion");

  // FECHA LOCAL
  // Evita que la fecha UTC cambie el día seleccionado.

  const hoy = new Date();

  fechaInput.value =
    hoy.getFullYear() + "-" +
    String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
    String(hoy.getDate()).padStart(2, "0");

  // RECUPERAR EQUIPO Y ROL

  const equipoGuardado =
    localStorage.getItem("Equipo") || "Junior A";

  const rolGuardado =
    localStorage.getItem("Rol") ||
    localStorage.getItem("rolUsuario") ||
    "Físico";

  equipoInput.value = equipoGuardado.trim();
  entrenamientoInput.value = rolGuardado.trim();

  if (
    rolGuardado.includes("Físico") ||
    rolGuardado.includes("Fisico") ||
    !duracionInput.value
  ) {
    duracionInput.value = 55;
  }

  // CARPETAS DE GOOGLE DRIVE

  const carpetasDriveIDs = {
    "Filial_Pista": "1-7UDm_-m7CqnqDhYfCjzT8WF57KRCSJT",
    "Filial_Físico": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ",
    "Filial_Fisico": "1cLib9Sq4OeB_zFreR-S72cA7b5-GCcGJ",

    "Desarrollo_Pista": "1AIcgSlgSKzzV4Vf_mqHFAvQ_bmuFMv48",
    "Desarrollo_Físico": "1V5xaBsWPeo8jDdvrQeo33_bT1CCOaZSX",
    "Desarrollo_Fisico": "1V5xaBsWPeo8jDdvrQeo33_bT1CCOaZSX",

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

  // ELEMENTOS DE CARGA DE ARCHIVOS

  const btnFoto = $("Foto");
  const btnDocumento = $("Documento");

  const inputFileFoto = $("inputFileFoto");
  const inputFileDocumento = $("inputFileDocumento");

  const imagen1 = $("Imagen1");
  const iconoDocumento = $("iconoDocumento");

  const panelArchivo = $("archivoSeleccionadoPanel");
  const nombreArchivo = $("nombreArchivo");
  const tamanoArchivo = $("tamanoArchivo");

  const btnEliminar = $("eliminarArchivo");
  const btnEnviar = $("Enviar");

  let archivoSeleccionado = null;
  let urlPreview = null;
  let ocupado = false;

  // Límite preventivo de tamaño.
  const MAX_MB = 10;
  const MAX_BYTES = MAX_MB * 1024 * 1024;

  // ABRIR CÁMARA

  btnFoto.addEventListener("click", () => {
    inputFileFoto.value = "";
    inputFileFoto.click();
  });

  // ABRIR SELECTOR DE DOCUMENTOS

  btnDocumento.addEventListener("click", () => {
    inputFileDocumento.value = "";
    inputFileDocumento.click();
  });

  // LIBERAR VISTA PREVIA

  function limpiarPreview() {
    if (urlPreview) {
      URL.revokeObjectURL(urlPreview);
      urlPreview = null;
    }

    imagen1.removeAttribute("src");
    imagen1.style.display = "none";
    iconoDocumento.style.display = "none";
  }

  // MOSTRAR ARCHIVO SELECCIONADO

  function seleccionarArchivo(file) {

    if (!file) return;

    if (file.size === 0) {
      alert("El archivo está vacío.");
      return;
    }

    if (file.size > MAX_BYTES) {
      alert(`El archivo supera el límite de ${MAX_MB} MB.`);
      return;
    }

    limpiarPreview();

    // Solo se permite un archivo por sesión.
    // Una nueva selección sustituye a la anterior.

    archivoSeleccionado = file;

    nombreArchivo.textContent = file.name;

    tamanoArchivo.textContent =
      file.size >= 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
        : (file.size / 1024).toFixed(1) + " KB";

    if (file.type.startsWith("image/")) {

      urlPreview = URL.createObjectURL(file);

      imagen1.src = urlPreview;
      imagen1.style.display = "block";

    } else {

      iconoDocumento.style.display = "inline-block";

    }

    panelArchivo.hidden = false;
  }

  inputFileFoto.addEventListener("change", e => {
    seleccionarArchivo(e.target.files[0]);
  });

  inputFileDocumento.addEventListener("change", e => {
    seleccionarArchivo(e.target.files[0]);
  });

  // ELIMINAR ARCHIVO

  function eliminarArchivoSeleccionado() {

    archivoSeleccionado = null;

    inputFileFoto.value = "";
    inputFileDocumento.value = "";

    limpiarPreview();

    nombreArchivo.textContent = "";
    tamanoArchivo.textContent = "";

    panelArchivo.hidden = true;
  }

  btnEliminar.addEventListener("click", () => {
    if (!ocupado) {
      eliminarArchivoSeleccionado();
    }
  });

  // DETECTAR EXTENSIÓN Y TIPO MIME

  const tiposMime = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    txt: "text/plain",
    csv: "text/csv",
    rtf: "application/rtf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    gif: "image/gif"
  };

  function obtenerExtension(file) {

    const coincidencia =
      /\.([a-zA-Z0-9]{1,10})$/.exec(file.name);

    if (coincidencia) {
      return coincidencia[1].toLowerCase();
    }

    const extensionMime = Object.keys(tiposMime).find(
      ext => tiposMime[ext] === file.type
    );

    return extensionMime || "bin";
  }

  // CONVERTIR ARCHIVO A BASE64

  function convertirBase64(file) {
    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = e => {

        const resultado = String(e.target.result);
        const separador = resultado.indexOf(",");

        if (separador === -1) {
          reject(new Error("No se pudo convertir el archivo."));
          return;
        }

        resolve(resultado.slice(separador + 1));
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  // BLOQUEAR CONTROLES DURANTE EL ENVÍO

  function establecerOcupado(estado) {

    ocupado = estado;

    btnEnviar.disabled = estado;
    btnFoto.disabled = estado;
    btnDocumento.disabled = estado;
    btnEliminar.disabled = estado;
    fechaInput.disabled = estado;
    duracionInput.disabled = estado;

    btnEnviar.textContent =
      estado ? "Subiendo..." : "Subir sesión";
  }

  // SUBIR SESIÓN

  btnEnviar.addEventListener("click", async () => {

    if (ocupado) return;

    const campos = [
      fechaInput,
      entrenamientoInput,
      equipoInput,
      duracionInput
    ];

    let valido = true;

    campos.forEach(campo => {

      if (!campo.value) {

        campo.style.backgroundColor = "#fee2e2";
        valido = false;

      } else {

        campo.style.backgroundColor = "";

      }
    });

    const duracion = Number(duracionInput.value);

    if (
      !Number.isInteger(duracion) ||
      duracion <= 0
    ) {
      duracionInput.style.backgroundColor = "#fee2e2";
      valido = false;
    }

    if (!valido) {
      alert("Comprueba los campos obligatorios.");
      return;
    }

    const equipoActual = equipoInput.value.trim();
    const tipoActual = entrenamientoInput.value.trim();
    const fechaActual = fechaInput.value;

    const claveBusqueda =
      `${equipoActual}_${tipoActual}`;

    const idCarpetaSeleccionada =
      carpetasDriveIDs[claveBusqueda];

    if (!idCarpetaSeleccionada) {

      alert(
        `No existe una carpeta asociada a ${equipoActual} - ${tipoActual}.`
      );

      console.error(
        "Claves disponibles:",
        Object.keys(carpetasDriveIDs)
      );

      return;
    }

    establecerOcupado(true);

    let formularioEnviado = false;

    try {

      // PREPARAR ARCHIVO ANTES DE REGISTRAR LA SESIÓN

      if (archivoSeleccionado) {

        btnEnviar.textContent = "Preparando archivo...";

        const base64Puro =
          await convertirBase64(archivoSeleccionado);

        const extension =
          obtenerExtension(archivoSeleccionado);

        const mimeType =
          archivoSeleccionado.type ||
          tiposMime[extension] ||
          "application/octet-stream";

        const nombreFinal =
          `${equipoActual}-${fechaActual}.${extension}`;

        $("inputDataImg").value = base64Puro;
        $("inputFilename").value = nombreFinal;
        $("inputMimetype").value = mimeType;
        $("inputFolderId").value = idCarpetaSeleccionada;

      }

      // REGISTRAR SESIÓN EN GOOGLE FORMS

      btnEnviar.textContent = "Registrando sesión...";

      const formData = new URLSearchParams();

      formData.append(
        "entry.279691575",
        fechaActual
      );

      formData.append(
        "entry.1010684221",
        equipoActual
      );

      formData.append(
        "entry.1004271819",
        tipoActual
      );

      formData.append(
        "entry.152725020",
        String(duracion)
      );

      await fetch(
        "https://docs.google.com/forms/d/1OsUlDQwOkJHkD8w8gIqERg4oP4FulmRmcAx_WoeMs4Y/formResponse",
        {
          method: "POST",
          mode: "no-cors",
          body: formData
        }
      );

      formularioEnviado = true;

      // ENVIAR FOTO O DOCUMENTO A DRIVE

      if (archivoSeleccionado) {

        btnEnviar.textContent = "Enviando archivo...";

        $("formOcultoDrive").submit();

        alert(
          "Sesión y archivo enviados. Comprueba su registro en Drive."
        );

      } else {

        alert(
          "Solicitud de registro de sesión enviada."
        );

      }

      eliminarArchivoSeleccionado();

    } catch (error) {

      console.error("Error general:", error);

      if (formularioEnviado) {

        alert(
          "Se ha enviado el registro de sesión, pero ha ocurrido un error al enviar el archivo. Comprueba los datos antes de repetir el envío."
        );

      } else {

        alert(
          "Hubo un error al enviar la sesión. Comprueba si se ha registrado antes de volver a intentarlo."
        );

      }

    } finally {

      establecerOcupado(false);

    }
  });

  // VOLVER AL MENÚ PRINCIPAL

  $("Menú").addEventListener("click", () => {

    if (!ocupado) {
      window.location.href = "menu_principal.html";
    }

  });

  window.addEventListener("pagehide", limpiarPreview);

});
