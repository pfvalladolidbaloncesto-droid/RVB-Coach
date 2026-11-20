
/*
 * Coach RVB · Registro Readiness
 *
 * Envío directo a Google Forms.
 *
 * Campos:
 * - ID
 * - Dolor muscular
 * - Fatiga
 * - Sueño
 * - Estrés
 *
 * Los cuatro sliders comienzan sin
 * ninguna respuesta seleccionada.
 */

// ============================================
// GOOGLE FORMS
// ============================================

const URL_READINESS =
  "https://docs.google.com/forms/d/e/1FAIpQLSf-xdXvGr9i_uofbSLhHrcyTcOalS6lBC4UK1iANSJf2atM4Q/formResponse";

const ENTRY_ID = "entry.467683432";

const ENTRY_DOLOR = "entry.148315985";

const ENTRY_FATIGA = "entry.1935157596";

const ENTRY_SUENO = "entry.1299849898";

const ENTRY_ESTRES = "entry.1016767713";

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const $ = id =>
      document.getElementById(id);

    // ======================================
    // JUGADOR SELECCIONADO
    // ======================================

    const jugador = String(
      localStorage.getItem("User") ||
      localStorage.getItem("jugadorSeleccionado") ||
      ""
    ).trim();

    $("labelID").textContent =
      jugador || "Sin jugador seleccionado";

    // ======================================
    // CONFIGURACIÓN DE LOS SLIDERS
    // ======================================

    const escalas = [
      {
        entrada: ENTRY_DOLOR,
        slider: $("deslizadorSoreness"),
        salida: $("respuestaSoreness"),
        nombre: "dolor muscular",
        valor: null
      },

      {
        entrada: ENTRY_FATIGA,
        slider: $("deslizadorFatiga"),
        salida: $("respuestaFatiga"),
        nombre: "fatiga",
        valor: null
      },

      {
        entrada: ENTRY_SUENO,
        slider: $("deslizadorSueno"),
        salida: $("respuestaSueno"),
        nombre: "sueño",
        valor: null
      },

      {
        entrada: ENTRY_ESTRES,
        slider: $("deslizadorEstres"),
        salida: $("respuestaEstres"),
        nombre: "estrés",
        valor: null
      }
    ];

    const btnEnviar = $("btnEnviar");

    let enviando = false;

    // ======================================
    // MENSAJES DE ESTADO
    // ======================================

    function informar(mensaje, clase = "") {

      const estado = $("estadoEnvio");

      estado.textContent = mensaje;

      estado.className = clase;
    }

    // ======================================
    // INICIALIZACIÓN SIN RESPUESTAS
    // ======================================

    for (const escala of escalas) {

      /*
       * Un input de tipo range necesita un
       * valor numérico interno.
       *
       * Aunque el HTML utiliza value="5",
       * ese valor NO se considera seleccionado.
       *
       * Solo se guardará un número cuando
       * el entrenador interactúe con la escala.
       */

      escala.valor = null;

      escala.salida.textContent = "-";

      escala.slider
        .closest(".slider-group")
        .classList.remove("seleccionado");

      // Guardar el valor tras la interacción

      const seleccionar = () => {

        escala.valor =
          Number(escala.slider.value);

        escala.salida.textContent =
          String(escala.valor);

        escala.slider
          .closest(".slider-group")
          .classList.add("seleccionado");

        informar("");
      };

      // Cambio mediante arrastre o teclado

      escala.slider.addEventListener(
        "input",
        seleccionar
      );

      // Permite seleccionar 5 tocando
      // directamente el centro del slider.

      escala.slider.addEventListener(
        "pointerup",
        seleccionar
      );
    }

    // ======================================
    // BOTÓN VOLVER
    // ======================================

    $("btnVolver").addEventListener(
      "click",
      () => {

        window.location.href =
          "selector.html";
      }
    );

    // ======================================
    // BOTÓN MENÚ
    // ======================================

    $("btnMenuPrincipal").addEventListener(
      "click",
      () => {

        window.location.href =
          "menu_principal.html";
      }
    );

    // ======================================
    // COMPROBAR JUGADOR
    // ======================================

    if (!jugador) {

      btnEnviar.disabled = true;

      informar(
        "Selecciona un jugador antes de registrar el Readiness.",
        "error"
      );
    }

    // ======================================
    // BOTÓN ENVIAR
    // ======================================

    btnEnviar.addEventListener(
      "click",
      async () => {

        if (enviando || !jugador) {
          return;
        }

        // ==================================
        // VALIDAR LAS CUATRO RESPUESTAS
        // ==================================

        const pendientes =
          escalas.filter(
            escala => escala.valor === null
          );

        if (pendientes.length) {

          const nombres =
            pendientes.map(
              escala => escala.nombre
            );

          informar(
            "Falta indicar: " +
            nombres.join(", ") +
            ".",
            "error"
          );

          return;
        }

        // ==================================
        // PREPARAR DATOS PARA GOOGLE FORMS
        // ==================================

        const parametros =
          new URLSearchParams();

        // ID del jugador

        parametros.set(
          ENTRY_ID,
          jugador
        );

        // Los cuatro valores de Readiness

        for (const escala of escalas) {

          parametros.set(
            escala.entrada,
            String(escala.valor)
          );
        }

        /*
         * Equivalente a:
         *
         * entry.467683432 = jugador
         * entry.148315985 = dolor muscular
         * entry.1935157596 = fatiga
         * entry.1299849898 = sueño
         * entry.1016767713 = estrés
         */

        // ==================================
        // BLOQUEAR ENVÍOS DUPLICADOS
        // ==================================

        enviando = true;

        btnEnviar.disabled = true;

        btnEnviar.textContent =
          "Enviando...";

        informar(
          "Enviando Readiness a Google Forms..."
        );

        // ==================================
        // ENVÍO
        // ==================================

        try {

          await fetch(
            URL_READINESS,
            {
              method: "POST",
              mode: "no-cors",
              credentials: "omit",
              cache: "no-store",
              body: parametros
            }
          );

          /*
           * Con no-cors no se puede leer
           * la respuesta de Google Forms.
           *
           * Por tanto, no podemos asegurar
           * que el registro se haya guardado.
           */

          informar(
            "Solicitud enviada. Comprueba " +
            "la hoja de respuestas para " +
            "confirmar el registro.",
            "exito"
          );

          btnEnviar.textContent =
            "Solicitud enviada";

          /*
           * Se mantiene deshabilitado el
           * botón para evitar duplicados.
           *
           * Para otro registro, vuelve
           * al selector de jugadores.
           */

        } catch (error) {

          console.error(
            "Error enviando Readiness:",
            error
          );

          informar(
            "No se pudo completar el envío. " +
            "Comprueba la hoja antes de " +
            "intentarlo de nuevo.",
            "error"
          );

          enviando = false;

          btnEnviar.disabled = false;

          btnEnviar.textContent = "Enviar";
        }
      }
    );
  }
);
