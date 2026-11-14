
/*
========================================
REGISTRAR TEST - COACH RVB
========================================

FUNCIONES:

1. Cargar tests básicos.
2. Cargar tests históricos del jugador.
3. Lateralidad independiente.
4. Textbox editable Test refinado.
5. Separar IZQ/DCH del texto final.
6. Registrar mediante el Google Form actual.
*/

// ========================================
// CONFIGURACIÓN
// ========================================

const URL_CONSULTAS_TEST =
  "https://script.google.com/macros/s/AKfycbw4pFSJsejB7Q5SaID_ixMWiED5hE7qVf_oSNuZPvOuecm0eCr7wWhYvBamrJ7CS8O6/exec";

const URL_FORM_TEST =
  "https://docs.google.com/forms/d/15YWvKXpfe_r9iPzBUpXNIdxuBihOFTol8vY35eTAEAA/formResponse";

const TESTS_BASICOS = [
  "SLR",
  "ANKLE",
  "DJ",
  "CMJ",
  "Abalakov"
];

let contadorPeticionesTest = 0;


// ========================================
// FUNCIONES AUXILIARES
// ========================================

function obtenerJugador() {

  return String(
    localStorage.getItem("User") ||
    localStorage.getItem("jugadorSeleccionado") ||
    ""
  ).trim();
}

function fechaActualLocal() {

  const ahora = new Date();

  const anio = ahora.getFullYear();

  const mes = String(
    ahora.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    ahora.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function normalizarNombreTest(valor) {

  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ");
}


// ========================================
// CONSULTA JSONP A APPS SCRIPT
// ========================================

function consultarListaTests(idJugador) {

  return new Promise((resolve, reject) => {

    const callback =
      "rvbTests_" +
      Date.now() +
      (++contadorPeticionesTest);

    const script =
      document.createElement("script");

    const url =
      new URL(URL_CONSULTAS_TEST);

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

    window[callback] = respuesta => {

      if (limpiar()) {
        resolve(respuesta);
      }
    };

    script.onerror = () => {

      if (limpiar()) {

        reject(
          new Error(
            "No se pudo conectar con Apps Script."
          )
        );
      }
    };

    script.onload = () => {

      if (!terminado) {

        if (limpiar()) {

          reject(
            new Error(
              "Apps Script no devolvió el callback esperado."
            )
          );
        }
      }
    };

    temporizador = setTimeout(() => {

      if (limpiar()) {

        reject(
          new Error(
            "Tiempo de espera agotado."
          )
        );
      }

    }, 15000);

    url.searchParams.set(
      "accion",
      "listaTests"
    );

    url.searchParams.set(
      "id",
      idJugador
    );

    url.searchParams.set(
      "callback",
      callback
    );

    url.searchParams.set(
      "_",
      String(Date.now())
    );

    // Necesario para la compatibilidad
    // comprobada con Chrome Android.
    script.crossOrigin = "anonymous";

    script.src = url.toString();

    document.head.appendChild(script);
  });
}


// ========================================
// UNIFICAR LISTAS DE TESTS
// ========================================

function combinarTests(
  basicos,
  historicos
) {

  const unicos = new Map();

  [...basicos, ...historicos].forEach(
    test => {

      const nombre =
        normalizarNombreTest(test);

      if (!nombre) return;

      const clave =
        nombre.toLocaleUpperCase("es");

      if (!unicos.has(clave)) {

        unicos.set(
          clave,
          nombre
        );
      }
    }
  );

  return [...unicos.values()]
    .sort(
      (a, b) =>
        a.localeCompare(b, "es")
    );
}


// ========================================
// SEPARAR TEST Y LATERALIDAD
// ========================================

/*
 Ejemplos:

 ANKLEIZQ    -> ANKLE + IZQ
 ANKLEDCH    -> ANKLE + DCH
 CMJ         -> CMJ + vacío
 NUEVOTEST   -> NUEVOTEST + vacío
 NUEVOTESTIZQ -> NUEVOTEST + IZQ
*/

function separarTestRefinado(valor) {

  const texto = normalizarNombreTest(valor);

  if (!texto) {

    return {
      test: "",
      lateralidad: ""
    };
  }

  // Detectar lateralidad al final
  const coincidencia = texto.match(
    /^(.*?)(IZQ|DCH)$/i
  );

  if (coincidencia) {

    const nombreBase =
      normalizarNombreTest(
        coincidencia[1]
      );

    if (nombreBase) {

      return {
        test: nombreBase,
        lateralidad:
          coincidencia[2].toUpperCase()
      };
    }
  }

  return {
    test: texto,
    lateralidad: ""
  };
}


// ========================================
// INICIALIZACIÓN DE LA PÁGINA
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const inputFecha =
      document.getElementById("fecha");

    const inputNombre =
      document.getElementById("nombre");

    const selectTest =
      document.getElementById("test");

    const selectLateralidad =
      document.getElementById("lateralidad");

    const inputTestRefinado =
      document.getElementById("testRefinado");

    const estadoTests =
      document.getElementById("estado-tests");

    const formulario =
      document.getElementById("form-registrar-test");

    const btnRegistrar =
      document.getElementById("btn-registrar");

    const btnVolver =
      document.getElementById("btn-volver");

    const jugador =
      obtenerJugador();


    // ====================================
    // FECHA Y JUGADOR
    // ====================================

    inputFecha.value =
      fechaActualLocal();

    inputNombre.value =
      jugador || "Sin usuario seleccionado";


    // ====================================
    // RELLENAR SELECTOR
    // ====================================

    function rellenarSelector(tests) {

      const seleccionAnterior =
        selectTest.value;

      selectTest.replaceChildren(
        new Option(
          "Selecciona un test...",
          ""
        )
      );

      tests.forEach(test => {

        selectTest.add(
          new Option(test, test)
        );
      });

      // Conservar selección actual
      if (
        [...selectTest.options].some(
          op =>
            op.value === seleccionAnterior
        )
      ) {

        selectTest.value =
          seleccionAnterior;
      }
    }


    // ====================================
    // ACTUALIZAR TEXTBOX AUTOMÁTICAMENTE
    // ====================================

    function actualizarTestRefinado() {

      const test =
        selectTest.value;

      const lateralidad =
        selectLateralidad.value;

      // Si no se ha seleccionado un test,
      // dejamos el textbox libre para escribir.
      if (!test) return;

      inputTestRefinado.value =
        test + lateralidad;
    }


    // ====================================
    // SELECTORES INDEPENDIENTES
    // ====================================

    selectTest.addEventListener(
      "change",
      actualizarTestRefinado
    );

    selectLateralidad.addEventListener(
      "change",
      actualizarTestRefinado
    );


    // ====================================
    // MOSTRAR TESTS BÁSICOS INMEDIATAMENTE
    // ====================================

    rellenarSelector(
      combinarTests(
        TESTS_BASICOS,
        []
      )
    );


    // ====================================
    // CARGAR TESTS DEL JUGADOR DESDE SHEETS
    // ====================================

    async function cargarTestsHistoricos() {

      if (!jugador) {

        estadoTests.textContent =
          "No se ha seleccionado ningún jugador.";

        estadoTests.classList.add(
          "error"
        );

        return;
      }

      estadoTests.textContent =
        "Sincronizando tests del jugador...";

      estadoTests.classList.remove(
        "error"
      );

      try {

        const respuesta =
          await consultarListaTests(jugador);

        if (
          !respuesta ||
          !respuesta.ok
        ) {

          throw new Error(
            respuesta?.error ||
            "Respuesta inválida del servidor."
          );
        }

        const historicos =
          Array.isArray(respuesta.tests)
            ? respuesta.tests
            : [];

        const listaFinal =
          combinarTests(
            TESTS_BASICOS,
            historicos
          );

        rellenarSelector(
          listaFinal
        );

        estadoTests.textContent =
          `${listaFinal.length} tests disponibles`;

      } catch (error) {

        // No bloquear el formulario
        estadoTests.textContent =
          "No se pudo sincronizar con Sheets. " +
          "Puedes usar los tests básicos o " +
          "escribir uno nuevo.";

        estadoTests.classList.add(
          "error"
        );

        console.warn(
          "Error al cargar tests:",
          error
        );
      }
    }

    cargarTestsHistoricos();


    // ====================================
    // BOTONES DE NAVEGACIÓN
    // ====================================

    btnVolver.addEventListener(
      "click",
      () => {

        window.location.href =
          "selector.html";
      }
    );


    // ====================================
    // ENVIAR REGISTRO
    // ====================================

    formulario.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const fecha =
          inputFecha.value;

        const textoFinal =
          normalizarNombreTest(
            inputTestRefinado.value
          );

        const resultado =
          document.getElementById(
            "resultado"
          ).value;

        if (!jugador) {

          alert(
            "No hay ningún jugador seleccionado."
          );

          return;
        }

        if (
          !fecha ||
          !textoFinal ||
          resultado === ""
        ) {

          alert(
            "Comprueba los campos obligatorios."
          );

          return;
        }

        // El texto final determina
        // el test y la lateralidad enviados.
        const datos =
          separarTestRefinado(textoFinal);

        if (!datos.test) {

          alert(
            "Introduce un nombre de test válido."
          );

          return;
        }

        // =================================
        // CONSTRUIR PETICIÓN AL FORMULARIO
        // =================================

        const parametros =
          new URLSearchParams({

            "entry.1509260909":
              jugador,

            "entry.2139116252":
              fecha,

            "entry.1616925557":
              datos.test,

            "entry.1899409210":
              datos.lateralidad,

            "entry.2040101941":
              resultado
          });

        btnRegistrar.disabled = true;

        btnRegistrar.textContent =
          "Registrando...";

        try {

          await fetch(
            URL_FORM_TEST +
            "?" +
            parametros.toString(),
            {
              method: "GET",
              mode: "no-cors",
              cache: "no-store"
            }
          );

          // Con no-cors no podemos comprobar
          // el contenido de la respuesta.
          alert(
            "Solicitud enviada al formulario."
          );

          window.location.href =
            "selector.html";

        } catch (error) {

          console.error(
            "Error al enviar el test:",
            error
          );

          alert(
            "No se pudo enviar el registro. " +
            "Comprueba la conexión."
          );

          btnRegistrar.disabled = false;

          btnRegistrar.textContent =
            "Registrar";
        }
      }
    );

  }
);
