
/*
  CONSULTAR TEST - COACH RVB

  Comparación de una o dos variables
  utilizando la hoja TESTS.

  Comparte el Apps Script de consultas
  con la aplicación de jugadores.
*/

const URL_CONSULTAS =
  "https://script.google.com/macros/s/AKfycbw4pFSJsejB7Q5SaID_ixMWiED5hE7qVf_oSNuZPvOuecm0eCr7wWhYvBamrJ7CS8O6/exec";

const COLORES = [
  "#168d70",
  "#3858bb"
];

let contadorPeticiones = 0;
let consultando = false;

const $ = id => document.getElementById(id);

// ============================================
// IDENTIFICAR ATLETA
// ============================================

// En la app de entrenadores, "User"
// identifica al atleta seleccionado.

function atletaActual() {
  return (
    localStorage.getItem("User") || ""
  ).trim();
}

function crear(tag, contenido, clase = "") {
  const nodo = document.createElement(tag);
  nodo.textContent = contenido;

  if (clase) {
    nodo.className = clase;
  }

  return nodo;
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
  return Number(n).toLocaleString("es-ES", {
    maximumFractionDigits: 3
  });
}

// ============================================
// CONEXIÓN CON APPS SCRIPT
// ============================================

// JSONP con crossOrigin anonymous,
// probado previamente en Chrome Android.

function pedirDatos(accion, parametros) {

  return new Promise((resolve, reject) => {

    const callback =
      "rvbTests_" +
      Date.now() +
      (++contadorPeticiones);

    const script =
      document.createElement("script");

    const url = new URL(URL_CONSULTAS);

    let finalizado = false;
    let temporizador;

    function terminar() {
      if (finalizado) return false;

      finalizado = true;

      clearTimeout(temporizador);
      script.remove();
      delete window[callback];

      return true;
    }

    window[callback] = datos => {
      if (terminar()) {
        resolve(datos);
      }
    };

    script.onerror = () => {
      if (terminar()) {
        reject(
          new Error(
            "No se pudo conectar con Apps Script."
          )
        );
      }
    };

    temporizador = setTimeout(() => {
      if (terminar()) {
        reject(
          new Error(
            "Tiempo de espera agotado."
          )
        );
      }
    }, 20000);

    url.searchParams.set(
      "accion",
      accion
    );

    Object.entries(parametros).forEach(
      ([clave, valor]) => {
        url.searchParams.set(
          clave,
          String(valor)
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

    // Solución de compatibilidad Chrome Android
    script.crossOrigin = "anonymous";

    script.src = url.toString();

    document.head.appendChild(script);
  });
}

// ============================================
// CARGAR TESTS DEL ATLETA
// ============================================

function llenarSelectores(tests) {

  const unicos = new Map();

  tests.forEach(t => {

    const nombre = String(t || "").trim();

    const clave =
      nombre.toLocaleUpperCase("es");

    if (
      nombre &&
      !unicos.has(clave)
    ) {
      unicos.set(clave, nombre);
    }
  });

  const opciones = [...unicos.values()]
    .sort(
      (a, b) =>
        a.localeCompare(b, "es")
    );

  ["test1", "test2"].forEach(id => {

    const selector = $(id);
    const valorAnterior = selector.value;

    selector.replaceChildren(
      new Option("Seleccionar test", "")
    );

    opciones.forEach(test => {
      selector.add(
        new Option(test, test)
      );
    });

    if (
      [...selector.options].some(
        opt => opt.value === valorAnterior
      )
    ) {
      selector.value = valorAnterior;
    }
  });
}

async function cargarTests() {

  const id = atletaActual();

  $("Nombre").textContent =
    id || "Atleta no definido";

  if (!id) {

    estado(
      "No hay ningún atleta seleccionado. " +
      "Vuelve al menú y selecciona uno."
    );

    llenarSelectores([]);
    return;
  }

  try {

    const respuesta = await pedirDatos(
      "listaTests",
      { id }
    );

    if (
      !respuesta ||
      !respuesta.ok
    ) {
      throw new Error(
        respuesta?.error ||
        "No se pudo recuperar la lista."
      );
    }

    const tests =
      Array.isArray(respuesta.tests)
        ? respuesta.tests
        : [];

    llenarSelectores(tests);

    if (!tests.length) {
      estado(
        "Este atleta no tiene tests " +
        "registrados en la hoja TESTS."
      );
    }

  } catch (error) {

    llenarSelectores([]);

    estado(
      "Error al cargar los tests: " +
      error.message
    );
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
      "No se ha identificado al atleta."
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
      "Las dos variables son idénticas. " +
      "Elige otra combinación."
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
        "Error en la consulta."
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
      "Error al consultar: " +
      error.message
    );

  } finally {

    consultando = false;

    $("Enviar").disabled = false;
  }
}

// ============================================
// AGRUPAR RESULTADOS POR FECHA
// ============================================

function agrupar(registros) {

  const mapa = new Map();

  for (const r of registros) {

    const fecha =
      String(r.fecha || "");

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      r.resultado === "" ||
      r.resultado === null ||
      r.resultado === undefined
    ) {
      continue;
    }

    const numero =
      Number(r.resultado);

    if (!Number.isFinite(numero)) {
      continue;
    }

    if (!mapa.has(fecha)) {
      mapa.set(fecha, []);
    }

    mapa.get(fecha).push(numero);
  }

  return mapa;
}

function escala(valores) {

  const min =
    Math.min(...valores);

  const max =
    Math.max(...valores);

  const amplitud = Math.max(
    max - min,
    Math.abs(max) * 0.08,
    1
  );

  const margen =
    amplitud * 0.14;

  return {
    min: min - margen,
    max: max + margen
  };
}

// ============================================
// GRÁFICA DE EVOLUCIÓN
// ============================================

function representar(series) {

  const destino =
    $("resultados");

  destino.replaceChildren(
    crear("h2", "Evolución de tests")
  );

  series.forEach(s => {
    s.dias = agrupar(
      s.registros
    );
  });

  // Eje X común: fechas con al menos
  // un registro de cualquiera de las variables.

  const fechas = [
    ...new Set(
      series.flatMap(
        s => [...s.dias.keys()]
      )
    )
  ].sort();

  if (!fechas.length) {

    destino.appendChild(
      crear(
        "p",
        "No hay resultados para las variables seleccionadas.",
        "mensaje"
      )
    );

    return;
  }

  // ==========================================
  // LEYENDA
  // ==========================================

  const leyenda =
    document.createElement("div");

  leyenda.className = "leyenda";

  series.forEach(s => {

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
  // CONFIGURACIÓN DE LA GRÁFICA
  // ==========================================

  const NS =
    "http://www.w3.org/2000/svg";

  const W = Math.max(
    680,
    150 + fechas.length * 68
  );

  const H = 355;

  const M = {
    izquierda: 72,
    derecha: series.length === 2
      ? 82
      : 28,
    arriba: 38,
    abajo: 88
  };

  const areaW =
    W - M.izquierda - M.derecha;

  const areaH =
    H - M.arriba - M.abajo;

  // Posición horizontal común para
  // las dos variables.

  const x = i =>
    M.izquierda +
    (
      fechas.length === 1
        ? areaW / 2
        : i * areaW /
          (fechas.length - 1)
    );

  // Escala vertical independiente
  // para cada variable.

  const escalas = series.map(
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

  svg.setAttribute(
    "width",
    W
  );

  svg.setAttribute(
    "height",
    H
  );

  svg.setAttribute(
    "viewBox",
    `0 0 ${W} ${H}`
  );

  svg.setAttribute(
    "role",
    "img"
  );

  svg.setAttribute(
    "aria-label",
    "Resultados de " +
    series.map(s => s.nombre).join(" y ")
  );

  function dibujar(
    tag,
    atributos,
    contenido
  ) {

    const n =
      document.createElementNS(NS, tag);

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
  // EJES VERTICALES Y CUADRÍCULA
  // ==========================================

  for (let i = 0; i <= 4; i++) {

    const yy =
      M.arriba +
      areaH * i / 4;

    dibujar("line", {
      x1: M.izquierda,
      y1: yy,
      x2: W - M.derecha,
      y2: yy,
      stroke: "#e5eaf0",
      "stroke-width": 1
    });

    series.forEach((s, j) => {

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

  // Nombre de cada eje Y

  series.forEach((s, j) => {

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
  // FECHAS DEL EJE X
  // ==========================================

  fechas.forEach((fecha, i) => {

    const xx = x(i);

    const yy =
      H - M.abajo + 19;

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

  // Panel para ver el valor de cada punto

  const detalle = crear(
    "div",
    "Toca un punto para consultar su valor.",
    "detalle-punto"
  );

  // ==========================================
  // DIBUJAR SERIES
  // ==========================================

  series.forEach((s, j) => {

    const medias = [];

    // Calcular media de cada fecha

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

    // Línea entre las medias diarias

    if (medias.length > 1) {

      dibujar("polyline", {
        points: medias.map(
          p =>
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

        // Desplazamiento horizontal
        // para separar valores del mismo día.

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

        const leyendaPunto =
          `${s.nombre} · ` +
          `${fechaEsp(fecha)} · ` +
          `medición ${n + 1}/${valores.length}: ` +
          numeroEsp(v);

        const titulo =
          document.createElementNS(
            NS,
            "title"
          );

        titulo.textContent = leyendaPunto;

        punto.appendChild(titulo);

        punto.addEventListener(
          "click",
          () => {
            detalle.textContent =
              leyendaPunto;
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

              detalle.textContent =
                leyendaPunto;
            }
          }
        );
      });
    });

    // Rombos: media de cada fecha

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
          style: "cursor:pointer",
          tabindex: 0
        }
      );

      const textoMedia =
        `${s.nombre} · ` +
        `${fechaEsp(p.fecha)} · ` +
        `media: ${numeroEsp(p.media)}`;

      rombo.addEventListener(
        "click",
        () => {
          detalle.textContent =
            textoMedia;
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

            detalle.textContent =
              textoMedia;
          }
        }
      );
    });
  });

  // ==========================================
  // RESULTADOS FINALES
  // ==========================================

  const desplazable =
    document.createElement("div");

  desplazable.className =
    "grafica-scroll";

  desplazable.appendChild(svg);

  destino.append(
    desplazable,
    detalle
  );

  const resumen = series.map(s => {

    const total = [...s.dias.values()]
      .reduce(
        (suma, v) =>
          suma + v.length,
        0
      );

    return (
      `${s.nombre}: ` +
      `${total} mediciones ` +
      `en ${s.dias.size} fechas`
    );

  }).join(" · ");

  destino.appendChild(
    crear(
      "p",
      resumen +
      ". Círculos: mediciones individuales. " +
      "Rombos y líneas: medias por fecha.",
      "nota"
    )
  );
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    $("Enviar").addEventListener(
      "click",
      consultar
    );

    cargarTests();
  }
);
