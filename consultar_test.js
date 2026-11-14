
/*
===========================================
CONSULTAR TEST - COACH RVB
===========================================

Usa el Apps Script de fuerza y tests.

El atleta seleccionado se lee de
localStorage.User.
*/

const URL_CONSULTAS =
  "https://script.google.com/macros/s/AKfycbw4pFSJsejB7Q5SaID_ixMWiED5hE7qVf_oSNuZPvOuecm0eCr7wWhYvBamrJ7CS8O6/exec";

const COLORES = [
  "#168d70",
  "#3858bb"
];

const $ = id => document.getElementById(id);

let contadorPeticiones = 0;
let consultando = false;

// ============================================
// FUNCIONES GENERALES
// ============================================

function atletaActual() {
  return (
    localStorage.getItem("User") || ""
  ).trim();
}

function crear(tag, contenido, clase = "") {
  const n = document.createElement(tag);
  n.textContent = contenido;

  if (clase) {
    n.className = clase;
  }

  return n;
}

function estado(mensaje) {
  $("resultados").replaceChildren(
    crear("p", mensaje, "mensaje")
  );
}

function fechaEsp(iso) {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  return m
    ? `${m[3]}/${m[2]}/${m[1]}`
    : iso;
}

function numeroEsp(n) {
  return Number(n).toLocaleString(
    "es-ES",
    { maximumFractionDigits: 3 }
  );
}

// ============================================
// CONEXIÓN CON APPS SCRIPT
// ============================================

function pedirDatos(accion, parametros) {

  return new Promise((resolve, reject) => {

    const callback =
      "rvbTests_" +
      Date.now() +
      (++contadorPeticiones);

    const url = new URL(URL_CONSULTAS);

    const script =
      document.createElement("script");

    let terminado = false;
    let temporizador;

    function limpiar() {

      if (terminado) return false;

      terminado = true;

      clearTimeout(temporizador);

      script.remove();

      delete window[callback];

      return true;
    }

    function fallar(mensaje) {

      if (limpiar()) {
        reject(new Error(mensaje));
      }
    }

    window[callback] = datos => {

      if (limpiar()) {
        resolve(datos);
      }
    };

    // Error de conexión o CORS
    script.onerror = () => {

      fallar(
        "Chrome ha bloqueado la conexión. " +
        "Comprueba que Apps Script esté publicado " +
        "y que esta página utilice su versión actual."
      );
    };

    // El recurso carga, pero no llama al callback
    script.onload = () => {

      if (!terminado) {

        fallar(
          "Apps Script respondió, pero no devolvió " +
          "el callback de tests. Comprueba que hayas " +
          "implementado una nueva versión con " +
          "listaTests y consultarTests."
        );
      }
    };

    // Evitar espera indefinida
    temporizador = setTimeout(() => {

      fallar(
        "La consulta ha superado 15 segundos. " +
        "Revisa la implementación de Apps Script."
      );

    }, 15000);

    url.searchParams.set(
      "accion",
      accion
    );

    Object.entries(parametros).forEach(
      ([k, v]) => {

        url.searchParams.set(
          k,
          String(v)
        );
      }
    );

    url.searchParams.set(
      "callback",
      callback
    );

    url.searchParams.set(
      "_",
      String(Date.now())
    );

    // Solución comprobada con Chrome Android
    script.crossOrigin = "anonymous";

    script.src = url.toString();

    document.head.appendChild(script);
  });
}

// ============================================
// RELLENAR SELECTORES
// ============================================

function rellenarTests(
  tests,
  mensaje = "Seleccionar test"
) {

  const unicos = new Map();

  tests.forEach(t => {

    const nombre =
      String(t || "").trim();

    if (
      nombre &&
      !unicos.has(nombre.toUpperCase())
    ) {

      unicos.set(
        nombre.toUpperCase(),
        nombre
      );
    }
  });

  const ordenados = [...unicos.values()]
    .sort(
      (a, b) => a.localeCompare(b, "es")
    );

  ["test1", "test2"].forEach(id => {

    const selector = $(id);
    const anterior = selector.value;

    selector.replaceChildren(
      new Option(mensaje, "")
    );

    ordenados.forEach(t => {

      selector.add(
        new Option(t, t)
      );
    });

    if (
      [...selector.options].some(
        op => op.value === anterior
      )
    ) {
      selector.value = anterior;
    }

    selector.disabled = !ordenados.length;
  });

  $("Enviar").disabled = !ordenados.length;
}

// ============================================
// MOSTRAR ERROR CON BOTÓN REINTENTAR
// ============================================

function mostrarErrorCarga(error) {

  rellenarTests(
    [],
    "No se pudieron cargar"
  );

  const resultados = $("resultados");

  resultados.replaceChildren(
    crear(
      "p",
      "Error al cargar los tests: " +
        error.message,
      "mensaje"
    )
  );

  const boton = crear(
    "button",
    "Reintentar carga",
    "btn-reintentar"
  );

  boton.type = "button";

  boton.addEventListener(
    "click",
    cargarTests
  );

  resultados.appendChild(boton);
}

// ============================================
// CARGAR TESTS DEL ATLETA
// ============================================

async function cargarTests() {

  const id = atletaActual();

  $("Nombre").textContent =
    id || "Atleta no definido";

  if (!id) {

    mostrarErrorCarga(
      new Error(
        "No hay jugador seleccionado " +
        "en la clave User."
      )
    );

    return;
  }

  $("Enviar").disabled = true;

  ["test1", "test2"].forEach(k => {

    $(k).disabled = true;

    $(k).replaceChildren(
      new Option(
        "Cargando tests...",
        ""
      )
    );
  });

  estado(
    "Conectando con Apps Script para " +
    "recuperar los tests de " + id + "..."
  );

  try {

    const r = await pedirDatos(
      "listaTests",
      { id }
    );

    if (!r || !r.ok) {

      throw new Error(
        r?.error ||
        "Respuesta inválida del servidor."
      );
    }

    const tests = Array.isArray(r.tests)
      ? r.tests
      : [];

    rellenarTests(tests);

    estado(
      tests.length
        ? "Selecciona una o dos variables y pulsa «Consultar test»."
        : "El atleta no tiene tests registrados en la hoja TESTS."
    );

  } catch (error) {

    mostrarErrorCarga(error);
  }
}

// ============================================
// CONSULTAR RESULTADOS
// ============================================

async function consultar() {

  if (consultando) return;

  const id = atletaActual();

  const test1 =
    $("test1").value;

  const lateralidad1 =
    $("lateralidad1").value;

  const test2 =
    $("test2").value;

  const lateralidad2 =
    $("lateralidad2").value;

  if (!id) {

    return estado(
      "No hay atleta seleccionado."
    );
  }

  if (!test1) {

    return estado(
      "Selecciona un test en la variable 1."
    );
  }

  if (
    test2 &&
    (test1 + lateralidad1).toUpperCase() ===
    (test2 + lateralidad2).toUpperCase()
  ) {

    return estado(
      "Has seleccionado dos variables idénticas."
    );
  }

  consultando = true;

  $("Enviar").disabled = true;

  estado("Consultando resultados...");

  try {

    const r = await pedirDatos(
      "consultarTests",
      {
        id,
        test1,
        lateralidad1,
        test2,
        lateralidad2
      }
    );

    if (!r || !r.ok) {

      throw new Error(
        r?.error ||
        "Respuesta inválida del servidor."
      );
    }

    const series = [
      {
        nombre: test1 + lateralidad1,
        registros: Array.isArray(r.serie1)
          ? r.serie1
          : [],
        color: COLORES[0]
      }
    ];

    if (test2) {

      series.push({
        nombre: test2 + lateralidad2,
        registros: Array.isArray(r.serie2)
          ? r.serie2
          : [],
        color: COLORES[1]
      });
    }

    representar(series);

  } catch (error) {

    estado(
      "No se pudo consultar: " +
      error.message
    );

  } finally {

    consultando = false;

    $("Enviar").disabled = false;
  }
}

// ============================================
// AGRUPAR POR FECHA
// ============================================

function agrupar(registros) {

  const mapa = new Map();

  registros.forEach(r => {

    const fecha =
      String(r.fecha || "");

    const valor = r.resultado;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      valor === "" ||
      valor == null
    ) {
      return;
    }

    const n = Number(valor);

    if (!Number.isFinite(n)) {
      return;
    }

    if (!mapa.has(fecha)) {
      mapa.set(fecha, []);
    }

    mapa.get(fecha).push(n);
  });

  return mapa;
}

function escala(valores) {

  const min = Math.min(...valores);
  const max = Math.max(...valores);

  const amplitud = Math.max(
    max - min,
    Math.abs(max) * 0.08,
    1
  );

  const margen = amplitud * 0.14;

  return {
    min: min - margen,
    max: max + margen
  };
}

// ============================================
// GRÁFICA DE EVOLUCIÓN
// ============================================

function representar(series) {

  const destino = $("resultados");

  destino.replaceChildren(
    crear("h2", "Evolución de tests")
  );

  series.forEach(s => {

    s.dias = agrupar(s.registros);
  });

  const omitidas = series
    .filter(s => !s.dias.size)
    .map(s => s.nombre);

  const conDatos = series
    .filter(s => s.dias.size);

  if (!conDatos.length) {

    destino.appendChild(
      crear(
        "p",
        "No hay resultados para las variables seleccionadas.",
        "mensaje"
      )
    );

    return;
  }

  // Fechas comunes
  const fechas = [
    ...new Set(
      conDatos.flatMap(
        s => [...s.dias.keys()]
      )
    )
  ].sort();

  // ==========================================
  // LEYENDA
  // ==========================================

  const leyenda =
    document.createElement("div");

  leyenda.className = "leyenda";

  conDatos.forEach(s => {

    const item = crear(
      "span",
      s.nombre,
      "leyenda-item"
    );

    item.style.color = s.color;

    leyenda.appendChild(item);
  });

  destino.appendChild(leyenda);

  // ==========================================
  // CONFIGURACIÓN SVG
  // ==========================================

  const NS =
    "http://www.w3.org/2000/svg";

  const W = Math.max(
    680,
    145 + fechas.length * 68
  );

  const H = 355;

  const M = {
    izquierda: 72,
    derecha: conDatos.length === 2
      ? 82
      : 28,
    arriba: 38,
    abajo: 88
  };

  const areaW =
    W - M.izquierda - M.derecha;

  const areaH =
    H - M.arriba - M.abajo;

  const x = i =>
    M.izquierda +
    (
      fechas.length === 1
        ? areaW / 2
        : i * areaW /
          (fechas.length - 1)
    );

  const escalas = conDatos.map(
    s => escala(
      [...s.dias.values()].flat()
    )
  );

  const y = (v, e) =>
    M.arriba +
    (e.max - v) /
    (e.max - e.min) *
    areaH;

  const svg =
    document.createElementNS(
      NS,
      "svg"
    );

  svg.setAttribute("width", W);
  svg.setAttribute("height", H);

  svg.setAttribute(
    "viewBox",
    `0 0 ${W} ${H}`
  );

  svg.setAttribute("role", "img");

  svg.setAttribute(
    "aria-label",
    "Evolución de " +
    conDatos.map(s => s.nombre).join(" y ")
  );

  function dibujar(
    tag,
    atributos,
    contenido
  ) {

    const n =
      document.createElementNS(
        NS,
        tag
      );

    Object.entries(
      atributos || {}
    ).forEach(([k, v]) => {

      n.setAttribute(
        k,
        String(v)
      );
    });

    if (contenido !== undefined) {
      n.textContent = String(contenido);
    }

    svg.appendChild(n);

    return n;
  }

  // ==========================================
  // EJES VERTICALES
  // ==========================================

  for (let i = 0; i < 5; i++) {

    const yy =
      M.arriba +
      areaH * i / 4;

    dibujar("line", {
      x1: M.izquierda,
      x2: W - M.derecha,
      y1: yy,
      y2: yy,
      stroke: "#e5eaf0"
    });

    conDatos.forEach((s, j) => {

      const e = escalas[j];

      const v =
        e.max -
        (e.max - e.min) * i / 4;

      dibujar("text", {
        x: j === 0
          ? M.izquierda - 10
          : W - M.derecha + 10,
        y: yy + 4,
        "text-anchor": j === 0
          ? "end"
          : "start",
        fill: s.color,
        "font-size": 12
      }, numeroEsp(v));
    });
  }

  // Nombre de cada eje
  conDatos.forEach((s, j) => {

    dibujar("text", {
      x: j === 0
        ? M.izquierda
        : W - M.derecha,
      y: 19,
      "text-anchor": j === 0
        ? "start"
        : "end",
      fill: s.color,
      "font-size": 13,
      "font-weight": "bold"
    }, s.nombre);
  });

  // ==========================================
  // EJE X COMÚN
  // ==========================================

  fechas.forEach((fecha, i) => {

    const xx = x(i);
    const yy = H - M.abajo + 19;

    dibujar("text", {
      x: xx,
      y: yy,
      "text-anchor": "end",
      "font-size": 12,
      fill: "#6b7785",
      transform:
        `rotate(-38 ${xx} ${yy})`
    }, fechaEsp(fecha));
  });

  const detalle = crear(
    "div",
    "Toca un punto para ver el valor.",
    "detalle-punto"
  );

  // ==========================================
  // DIBUJAR SERIES
  // ==========================================

  conDatos.forEach((s, j) => {

    const medias = [];

    fechas.forEach((fecha, i) => {

      const valores =
        s.dias.get(fecha);

      if (!valores) return;

      const media =
        valores.reduce(
          (a, b) => a + b,
          0
        ) / valores.length;

      medias.push({
        i,
        fecha,
        media
      });
    });

    // Línea entre medias diarias
    if (medias.length > 1) {

      dibujar("polyline", {
        points: medias.map(p =>
          `${x(p.i)},${y(p.media, escalas[j])}`
        ).join(" "),
        fill: "none",
        stroke: s.color,
        "stroke-width": 3,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      });
    }

    // Todas las mediciones individuales
    fechas.forEach((fecha, i) => {

      const valores =
        s.dias.get(fecha);

      if (!valores) return;

      valores.forEach((v, n) => {

        const desplazamiento =
          (
            n -
            (valores.length - 1) / 2
          ) * 9;

        const punto = dibujar(
          "circle",
          {
            cx: x(i) + desplazamiento,
            cy: y(v, escalas[j]),
            r: 5,
            fill: "white",
            stroke: s.color,
            "stroke-width": 2.5,
            tabindex: 0,
            style: "cursor:pointer"
          }
        );

        const etiqueta =
          `${s.nombre} · ` +
          `${fechaEsp(fecha)} · ` +
          `medición ${n + 1}/${valores.length}: ` +
          numeroEsp(v);

        const titulo =
          document.createElementNS(
            NS,
            "title"
          );

        titulo.textContent = etiqueta;

        punto.appendChild(titulo);

        punto.addEventListener(
          "click",
          () => {
            detalle.textContent = etiqueta;
          }
        );

        punto.addEventListener(
          "keydown",
          e => {

            if (
              e.key === "Enter" ||
              e.key === " "
            ) {

              e.preventDefault();
              detalle.textContent = etiqueta;
            }
          }
        );
      });
    });

    // Rombos: medias diarias
    medias.forEach(p => {

      const xx = x(p.i);
      const yy =
        y(p.media, escalas[j]);

      const rombo = dibujar(
        "polygon",
        {
          points:
            `${xx},${yy - 5} ` +
            `${xx + 5},${yy} ` +
            `${xx},${yy + 5} ` +
            `${xx - 5},${yy}`,
          fill: s.color,
          stroke: "white",
          "stroke-width": 1,
          tabindex: 0,
          style: "cursor:pointer"
        }
      );

      const etiqueta =
        `${s.nombre} · ` +
        `${fechaEsp(p.fecha)} · ` +
        `media: ${numeroEsp(p.media)}`;

      rombo.addEventListener(
        "click",
        () => {
          detalle.textContent = etiqueta;
        }
      );

      rombo.addEventListener(
        "keydown",
        e => {

          if (
            e.key === "Enter" ||
            e.key === " "
          ) {

            e.preventDefault();
            detalle.textContent = etiqueta;
          }
        }
      );
    });
  });

  // ==========================================
  // RESULTADO
  // ==========================================

  const scroll =
    document.createElement("div");

  scroll.className = "grafica-scroll";

  scroll.appendChild(svg);

  destino.append(
    scroll,
    detalle
  );

  const resumen = conDatos.map(s => {

    const n = [...s.dias.values()]
      .reduce(
        (total, a) => total + a.length,
        0
      );

    return (
      `${s.nombre}: ${n} mediciones ` +
      `en ${s.dias.size} fechas`
    );

  }).join(" · ");

  destino.appendChild(
    crear(
      "p",
      resumen +
      (
        omitidas.length
          ? `. Sin registros: ${omitidas.join(", ")}.`
          : "."
      ) +
      " Círculos = mediciones individuales; " +
      "rombos y línea = medias diarias.",
      "nota"
    )
  );
}

// ============================================
// VOLVER AL SELECTOR
// ============================================

function volverAlSelector() {

  // Regresar a la pantalla desde
  // la que se seleccionó el jugador.
  if (window.history.length > 1) {

    window.history.back();

  } else {

    // Si esta página se abrió directamente
    window.location.href =
      "menu_principal.html";
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    $("volver-selector").addEventListener(
      "click",
      volverAlSelector
    );

    $("Enviar").addEventListener(
      "click",
      consultar
    );

    cargarTests();
  }
);
