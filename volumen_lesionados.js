
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const API = 'https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec';

  let seq = 0;
  let ocupado = false;
  let registros = [];
  let fechaConsulta = '';
  let cambios = new Map();

  const usuario = String(
    localStorage.getItem('User') ||
    localStorage.getItem('jugadorSeleccionado') ||
    ''
  ).trim();

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================

  function token() {
    const s = JSON.parse(
      sessionStorage.getItem('rvb_coach_sesion') || 'null'
    );

    if (!s?.token) {
      location.replace('index.html');
      throw new Error('Sesión no válida.');
    }

    return s.token;
  }

  // ==========================================
  // CONEXIÓN CON APPS SCRIPT - JSONP
  // ==========================================

  function pedir(p) {
    return new Promise((resolve, reject) => {

      const cb = 'rvbAlta_' + Date.now() + (++seq);
      const script = document.createElement('script');
      const url = new URL(API);

      Object.entries({
        ...p,
        token: token(),
        callback: cb,
        _: Date.now()
      }).forEach(([k, v]) => {
        url.searchParams.set(k, String(v));
      });

      let done = false;

      const timer = setTimeout(() => {
        fin(new Error(
          'Tiempo de espera agotado. Apps Script no ha respondido.'
        ));
      }, 35000);

      function fin(err, data) {
        if (done) return;

        done = true;

        clearTimeout(timer);
        script.remove();
        delete window[cb];

        if (err) {
          reject(err);

        } else if (!data?.ok) {
          reject(new Error(
            data?.error || 'Error del servidor.'
          ));

        } else {
          resolve(data);
        }
      }

      window[cb] = data => {
        console.log('Respuesta Apps Script:', data);
        fin(null, data);
      };

      script.onerror = error => {
        console.error('Error de conexión JSONP:', error);
        console.error('Acción solicitada:', p.accion);

        fin(new Error(
          'No se pudo conectar con Apps Script.'
        ));
      };

      // CONEXIÓN ACTUALIZADA

      script.crossOrigin = 'anonymous';
      script.src = url.toString();

      document.head.appendChild(script);
    });
  }

  // ==========================================
  // ESTADO Y BLOQUEO DE CONTROLES
  // ==========================================

  function estado(t) {
    $('estado').textContent = t;
  }

  function bloquear(v) {
    ocupado = v;

    document.querySelectorAll('button,input').forEach(el => {
      el.disabled =
        v || el.dataset.protegido === '1';
    });

    $('guardar').disabled =
      v || !cambios.size;
  }

  function texto(tag, t, parent) {
    const el = document.createElement(tag);

    el.textContent = t;
    parent.append(el);

    return el;
  }

  // ==========================================
  // MOSTRAR RESULTADOS
  // ==========================================

  function render() {

    const area = $('resultados');

    area.replaceChildren();
    cambios.clear();

    for (const r of registros) {

      const a = document.createElement('article');
      area.append(a);

      texto(
        'strong',
        r.fecha.split('-').reverse().join('/') +
        ' · ' + r.equipo +
        ' · ' + r.entrenamiento,
        a
      );

      texto(
        'p',
        r.estatus +
        ' | Duración equipo: ' +
        (
          r.generico === null
            ? 'No disponible / ambigua'
            : r.generico + ' min'
        ),
        a
      );

      texto(
        'p',
        'Duración individual actual: ' +
        (
          typeof r.valor === 'number'
            ? r.valor + ' min'
            : r.valor || 'Sin indicar'
        ) +
        (r.manual ? ' (manual)' : ''),
        a
      );

      const actions = document.createElement('div');

      actions.className = 'actions';
      a.append(actions);

      // CAMPO DE MINUTOS

      const inp = document.createElement('input');

      inp.type = 'number';
      inp.min = '0';
      inp.max = '1440';
      inp.step = 'any';

      inp.setAttribute(
        'aria-label',
        'Minutos individuales ' + r.fecha
      );

      inp.value =
        typeof r.valor === 'number'
          ? r.valor
          : '';

      inp.placeholder =
        r.generico === null
          ? 'Minutos'
          : String(r.generico);

      actions.append(inp);

      // RESTAURAR FÓRMULA

      const reset = texto(
        'button',
        'Restaurar fórmula',
        actions
      );

      reset.type = 'button';

      const note = texto('small', '', a);

      // PROTEGER LA ÚLTIMA FILA

      if (!r.editable) {

        inp.dataset.protegido = '1';
        reset.dataset.protegido = '1';

        note.textContent =
          'Última fila protegida. Podrás editarla cuando exista otra entrada.';
      }

      // COMPROBAR SI EXISTE UNA FÓRMULA RESPALDADA

      if (!r.restaurable) {

        reset.dataset.protegido = '1';

        reset.title =
          'Solo se restaura una fórmula previamente guardada por esta herramienta.';
      }

      // DETECTAR CAMBIOS EN LOS MINUTOS

      inp.addEventListener('input', () => {

        note.textContent = '';

        if (
          inp.value === '' ||
          (
            typeof r.valor === 'number' &&
            Number(inp.value) === r.valor
          )
        ) {

          cambios.delete(r.fila);

        } else {

          cambios.set(r.fila, {
            fila: r.fila,
            firma: r.firma,
            minutos: Number(inp.value)
          });
        }

        $('guardar').disabled = !cambios.size;
      });

      // SOLICITAR RESTAURACIÓN DE LA FÓRMULA

      reset.addEventListener('click', () => {

        cambios.set(r.fila, {
          fila: r.fila,
          firma: r.firma,
          restaurar: true
        });

        inp.value = '';

        note.textContent =
          'Se restaurará la fórmula al guardar.';

        $('guardar').disabled = false;
      });
    }

    $('guardar').hidden = !registros.length;

    bloquear(false);
  }

  // ==========================================
  // BUSCAR LAS ÚLTIMAS CUATRO ENTRADAS
  // ==========================================

  async function buscar() {

    if (ocupado) return;

    const fecha = $('fecha').value;

    if (!usuario || !fecha) {

      estado('Selecciona jugador y fecha.');
      return;
    }

    bloquear(true);

    estado('Buscando sesiones...');

    $('resultados').replaceChildren();
    $('guardar').hidden = true;

    cambios.clear();

    try {

      const r = await pedir({
        accion: 'volumenLesionados',
        usuario,
        fecha
      });

      registros = r.registros || [];
      fechaConsulta = fecha;

      render();

      if (!registros.length) {

        estado(
          'No se encontraron sesiones con estatus Limitado o Lesionado.'
        );

      } else {

        estado(
          registros.length + ' entrada(s) encontrada(s).'
        );
      }

    } catch (e) {

      console.error(
        'Error al buscar volumen lesionados:',
        e
      );

      estado(e.message);

    } finally {

      bloquear(false);
    }
  }

  // ==========================================
  // INICIALIZACIÓN DE LA PANTALLA
  // ==========================================

  $('jugador').textContent =
    usuario || 'Sin seleccionar';

  const d = new Date();

  $('fecha').value = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');

  // VOLVER AL SELECTOR

  $('volver').onclick = () => {

    if (
      !ocupado &&
      (
        !cambios.size ||
        confirm('¿Salir sin guardar?')
      )
    ) {

      location.href = 'selector.html';
    }
  };

  // BOTÓN BUSCAR

  $('buscarForm').onsubmit = e => {

    e.preventDefault();

    if (
      !cambios.size ||
      confirm('¿Descartar cambios pendientes?')
    ) {

      buscar();
    }
  };

  // CAMBIO DE FECHA

  $('fecha').onchange = () => {

    if ($('fecha').value !== fechaConsulta) {

      $('resultados').replaceChildren();

      cambios.clear();

      $('guardar').hidden = true;

      estado('Pulsa Buscar para la nueva fecha.');
    }
  };

  // ==========================================
  // GUARDAR MODIFICACIONES
  // ==========================================

  $('guardar').onclick = async () => {

    if (ocupado || !cambios.size) return;

    if ($('fecha').value !== fechaConsulta) {

      estado('Busca de nuevo.');
      return;
    }

    // VALIDAR MINUTOS

    if (
      [...cambios.values()].some(c =>
        !c.restaurar &&
        (
          !Number.isFinite(c.minutos) ||
          c.minutos < 0 ||
          c.minutos > 1440
        )
      )
    ) {

      estado('Introduce minutos entre 0 y 1440.');
      return;
    }

    if (
      !confirm(
        '¿Guardar los cambios de duración individual?'
      )
    ) {
      return;
    }

    bloquear(true);

    estado('Guardando y verificando...');

    try {

      const envioId = crypto.randomUUID();

      // ENVIAR MODIFICACIONES AL SERVIDOR

      await fetch(API, {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',

        body: new URLSearchParams({
          accion: 'guardarVolumen',
          token: token(),
          usuario,
          fecha: fechaConsulta,
          envioId,
          cambios: JSON.stringify(
            [...cambios.values()]
          )
        })
      });

      // COMPROBAR QUE APPS SCRIPT HA GUARDADO

      let confirmado = false;

      for (let i = 0; i < 20; i++) {

        await new Promise(
          r => setTimeout(r, 1500)
        );

        const s = await pedir({
          accion: 'estadoVolumen',
          envioId
        });

        if (s.estado === 'error') {
          throw new Error(s.error);
        }

        if (s.estado === 'ok') {

          confirmado = true;
          break;
        }
      }

      if (!confirmado) {

        throw new Error(
          'No se recibió confirmación. Busca de nuevo antes de repetir.'
        );
      }

      // ACTUALIZAR LOS RESULTADOS

      cambios.clear();

      bloquear(false);

      await buscar();

      estado(
        'Guardado confirmado. ' +
        $('estado').textContent
      );

    } catch (e) {

      console.error(
        'Error al guardar volumen lesionados:',
        e
      );

      estado(
        e.message +
        ' Comprueba los datos antes de repetir.'
      );

    } finally {

      bloquear(false);
    }
  };

})();
