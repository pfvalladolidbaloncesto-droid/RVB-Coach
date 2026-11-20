/*
 * Coach RVB · Comunicación compartida de Carga Jugador y Carga Equipo.
 * JSONP evita el fallo CORS de fetch() frente a Google Apps Script.
 * El informe se muestra en el navegador, y la descarga es una acción separada.
 */
(function () {
  "use strict";

  const URL_SCRIPT =
    "https://script.google.com/macros/s/AKfycbwXRzLttUWIv82OeF1OI2UU06EADWvwBtcFKbck-fkdXesMKLTZUHbhrT9sP_40HhMexA/exec";

  const ID_LIBRO = "1waAXuyLOYY7yp0WQzv17OTOPvcZ4uvuhKGkp1YdlOrQ";
  const INFORMES = {
    jugador: { gid: "1857963185", rango: "E1:S110" },
    equipo:  { gid: "1855641404", rango: "A1:Q208" }
  };
  let numeroPeticion = 0;

  function fechaHoy() {
    const f = new Date();
    const dos = n => String(n).padStart(2, "0");
    return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
  }

  function fechaParaHoja(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) throw new Error("Selecciona una fecha válida.");
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (d.getFullYear() !== Number(m[1]) ||
        d.getMonth() + 1 !== Number(m[2]) ||
        d.getDate() !== Number(m[3])) {
      throw new Error("La fecha seleccionada no existe.");
    }
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  function solicitar(datos) {
    return new Promise((resolver, rechazar) => {
      const nombre = `rvbInforme_${Date.now()}_${++numeroPeticion}`;
      const etiqueta = document.createElement("script");
      const url = new URL(URL_SCRIPT);
      let resuelto = false;
      let temporizador;

      function terminar(error, resultado) {
        if (resuelto) return;
        resuelto = true;
        clearTimeout(temporizador);
        etiqueta.remove();
        delete window[nombre];
        if (error) rechazar(error);
        else resolver(resultado);
      }

      window[nombre] = respuesta => terminar(null, respuesta);
      etiqueta.onerror = () => terminar(new Error(
        "No se ha podido contactar con el Apps Script. Comprueba la URL y su implementación."
      ));
      etiqueta.onload = () => {
        if (!resuelto) terminar(new Error(
          "El Apps Script no devolvió la respuesta esperada. " +
          "Comprueba que sustituiste las dos funciones doGet anteriores por la nueva."
        ));
      };

      for (const [clave, valor] of Object.entries(datos)) {
        url.searchParams.set(clave, String(valor));
      }
      url.searchParams.set("callback", nombre);
      url.searchParams.set("_", String(Date.now()));
      etiqueta.crossOrigin = "anonymous";
      etiqueta.src = url.toString();
      temporizador = setTimeout(() => terminar(new Error(
        "El Apps Script ha tardado demasiado en responder."
      )), 30000);
      document.head.appendChild(etiqueta);
    });
  }

  // Enlace original de impresión de Informe equipo proporcionado
  // por el usuario. Evita construir un /export genérico para este informe.
  const URL_PDF_EQUIPO_ORIGINAL =
    "https://docs.google.com/spreadsheets/d/1waAXuyLOYY7yp0WQzv17OTOPvcZ4uvuhKGkp1YdlOrQ/pdf?id=1waAXuyLOYY7yp0WQzv17OTOPvcZ4uvuhKGkp1YdlOrQ&esid=73d091b67a0800ea&a=true&pc=%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C0%2C%5B%5B%221855641404%22%2C0%2C208%2C0%2C17%5D%5D%2C10000000%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C45554.41125608796%2Cnull%2Cnull%2C%5B1%2Cnull%2C0%2C0%2C0%2C0%2C0%2C0%2C1%2C1%2C2%2C1%2Cnull%2Cnull%2C2%2C1%5D%2C%5B%22A4%22%2C1%2C2%2C1%2C%5B0.75%2C0.75%2C0.7%2C0.7%5D%5D%2Cnull%2C0%5D&gf=%5B%5D&lds=%5B%5D";

  function urlPdf(tipo, descargar = false) {
    if (tipo === "equipo") {
      // Para descargar, Google puede ofrecer directamente el PDF o
      // mostrar su visor; en ambos casos el navegador permite guardarlo.
      const url = new URL(URL_PDF_EQUIPO_ORIGINAL);
      if (descargar) url.searchParams.set("attachment", "true");
      return url.toString();
    }

    // El enlace de jugador se deja como estaba.
    const informe = INFORMES[tipo];
    if (!informe) throw new Error("Tipo de informe desconocido.");
    const url = new URL(
      `https://docs.google.com/spreadsheets/d/${ID_LIBRO}/export`
    );
    url.searchParams.set("format", "pdf");
    url.searchParams.set("gid", informe.gid);
    url.searchParams.set("range", informe.rango);
    url.searchParams.set("size", "A4");
    url.searchParams.set("portrait", "true");
    url.searchParams.set("fitw", "true");
    url.searchParams.set("gridlines", "false");
    url.searchParams.set("sheetnames", "false");
    url.searchParams.set("printtitle", "false");
    url.searchParams.set("top_margin", "0.5");
    url.searchParams.set("bottom_margin", "0.5");
    url.searchParams.set("left_margin", "0.5");
    url.searchParams.set("right_margin", "0.5");
    url.searchParams.set("attachment", descargar ? "true" : "false");
    url.searchParams.set("_", String(Date.now()));
    return url.toString();
  }

  window.RVBInformes = Object.freeze({
    solicitar, urlPdf, fechaHoy, fechaParaHoja
  });
})();
