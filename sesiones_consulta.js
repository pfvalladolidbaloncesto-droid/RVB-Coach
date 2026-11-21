/* Coach RVB · Sesiones Equipo y Sesiones Jugador.
   Consulta el backend de login/lesiones, que valida la sesión del staff. */
const URL_API_SESIONES =
  "https://script.google.com/macros/s/AKfycbyso6H_FvkRCOu5_y0BxX4pQMPvwpaxH12_lW2MJWyXgEGp4w49rnkvpy2xTBWbrLI33Q/exec";

(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const modo = new URLSearchParams(location.search).get("modo") === "jugador" ? "jugador" : "equipo";
  let secuencia = 0;
  let ocupado = false;

  function hoyLocal() {
    const d = new Date(), dos = n => String(n).padStart(2,"0");
    return `${d.getFullYear()}-${dos(d.getMonth()+1)}-${dos(d.getDate())}`;
  }

  function mensaje(texto, estado = "") {
    $("estado").textContent = texto;
    $("estado").className = `estado ${estado}`;
  }

  function pedirSesiones(parametros) {
    return new Promise((resolve, reject) => {
      const callback = `rvbAlta_${Date.now()}${++secuencia}`;
      const script = document.createElement("script");
      const url = new URL(URL_API_SESIONES);
      url.searchParams.set("accion", "consultarSesiones");
      url.searchParams.set("callback", callback);
      for (const [k,v] of Object.entries(parametros)) url.searchParams.set(k, String(v));
      url.searchParams.set("_", String(Date.now()));
      let terminado = false;
      const limite = setTimeout(() => concluir(new Error("La consulta ha superado los 35 segundos.")),35000);
      function concluir(error, data) {
        if(terminado) return;
        terminado = true;
        clearTimeout(limite);
        script.remove();
        delete window[callback];
        if (error) reject(error); else resolve(data);
      }
      window[callback] = data => concluir(null,data);
      script.onerror = () => concluir(new Error("No se ha podido conectar con Apps Script."));
      script.crossOrigin = "anonymous";
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function ponerEnlaceDocumento(articulo, r) {
    if (r.documento && r.documento.url) {
      const a = document.createElement("a");
      a.className = "archivo";
      a.href = r.documento.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Abrir sesión · " + r.documento.nombre;
      articulo.appendChild(a);
    } else {
      const span = document.createElement("span");
      span.className = "sinarchivo";
      span.textContent = "Sin documento de sesión en Drive";
      articulo.appendChild(span);
    }
  }

  function renderizar(registros) {
    const area = $("listado");
    area.replaceChildren();
    if (!registros.length) {
      const p = document.createElement("p");
      p.className = "ayuda";
      p.textContent = "No hay sesiones que coincidan con los filtros.";
      area.appendChild(p);
      return;
    }
    for (const r of registros) {
      const articulo = document.createElement("article");
      const primera = document.createElement("div");
      primera.className = "fila";
      const titulo = document.createElement("strong");
      titulo.textContent = r.fechaTexto + " · " + r.equipo;
      const tipo = document.createElement("span");
      tipo.className = "tipo";
      tipo.textContent = r.entrenamiento;
      primera.append(titulo, tipo);
      articulo.appendChild(primera);

      if (modo === "jugador") {
        // RPE individual (escala verde -> amarillo -> rojo, 0 a 10).
        const datos = document.createElement("div");
        datos.className = "datos-jugador";
        const bloqueRpe = document.createElement("div");
        bloqueRpe.className = "dato-rpe";
        const labelRpe = document.createElement("span");
        labelRpe.className = "dato-label";
        labelRpe.textContent = "RPE";
        const valorRpe = document.createElement("span");
        valorRpe.className = "valor-rpe";
        const numero = r.rpe === "" || r.rpe === null || r.rpe === undefined
          ? NaN : Number(r.rpe);

        if (Number.isFinite(numero) && numero >= 0 && numero <= 10) {
          const redondeado = Number(numero.toFixed(1));
          valorRpe.textContent = redondeado + "/10";
          // Fondo tenue de verde a rojo; el número sigue siendo legible.
          const tono = 120 * (1 - numero / 10);
          valorRpe.style.backgroundColor = `hsl(${tono} 75% 91%)`;
          valorRpe.style.borderColor = `hsl(${tono} 65% 46%)`;
          valorRpe.style.color = "#1f2937";

          const medidor = document.createElement("div");
          medidor.className = "escala-rpe";
          medidor.setAttribute("role", "img");
          medidor.setAttribute("aria-label", `RPE ${redondeado} de 10`);
          const marca = document.createElement("span");
          marca.className = "marca-rpe";
          marca.style.left = `${numero * 10}%`;
          medidor.appendChild(marca);
          bloqueRpe.append(labelRpe, valorRpe, medidor);
        } else {
          valorRpe.textContent = r.rpe === "" || r.rpe == null ? "—" : String(r.rpe);
          bloqueRpe.append(labelRpe, valorRpe);
        }

        const bloqueDuracion = document.createElement("div");
        bloqueDuracion.className = "dato-duracion";
        const labelDuracion = document.createElement("span");
        labelDuracion.className = "dato-label";
        labelDuracion.textContent = "Duración";
        const duracion = document.createElement("strong");
        duracion.textContent = r.duracion === "" || r.duracion === null || r.duracion === undefined
          ? "Sin indicar" : r.duracion + " min";
        bloqueDuracion.append(labelDuracion, duracion);

        // Estatus procede de la columna J de RPE (no de I, que es el RPE).
        const bloqueEstatus = document.createElement("div");
        bloqueEstatus.className = "dato-estatus";
        const labelEstatus = document.createElement("span");
        labelEstatus.className = "dato-label";
        labelEstatus.textContent = "Estatus";
        const valorEstatus = document.createElement("span");
        valorEstatus.className = "valor-estatus";
        const estatusTexto = String(r.estatus == null ? "" : r.estatus).trim();
        valorEstatus.textContent = estatusTexto || "Sin indicar";
        const estatusClave = estatusTexto.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        if (estatusClave === "completo") valorEstatus.classList.add("estatus-completo");
        else if (estatusClave === "limitado") valorEstatus.classList.add("estatus-limitado");
        else if (estatusClave === "lesionado") valorEstatus.classList.add("estatus-lesionado");
        else if (estatusClave === "ausente") valorEstatus.classList.add("estatus-ausente");
        bloqueEstatus.append(labelEstatus, valorEstatus);

        datos.append(bloqueRpe, bloqueEstatus, bloqueDuracion);
        articulo.appendChild(datos);
      } else {
        // Sesiones Equipo: conservar exactamente sus datos anteriores.
        const detalles = document.createElement("p");
        detalles.className = "detalles";
        detalles.textContent = "Duración: " +
          (r.volumen === "" ? "Sin indicar" : r.volumen + " min");
        articulo.appendChild(detalles);
      }
      ponerEnlaceDocumento(articulo, r);
      area.appendChild(articulo);
    }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    $("titulo").textContent=modo==="jugador"?"Sesiones Jugador":"Sesiones Equipo";
    $("ayuda-filtros").textContent = modo === "jugador"
      ? "Últimos 6 registros de RPE del jugador hasta la fecha elegida. Muestra RPE, estatus (columna J), duración individual y el documento colectivo de Drive, si existe."
      : "Se consultan las seis últimas entradas hasta la fecha elegida. «Sesión» enlaza al documento de Drive cuando existe.";
    const eq=localStorage.getItem("Equipo")||localStorage.getItem("equipoUsuario")||"";
    if([...$("equipo").options].some(o=>o.value===eq)) $("equipo").value=eq;
    $("entrenamiento").value="Todos";
    $("fecha").value=hoyLocal();
    const jugador=String(localStorage.getItem("User")||localStorage.getItem("jugadorSeleccionado")||"").trim();
    if(modo==="jugador"){
      $("campo-jugador").hidden=false;
      $("jugador").value=jugador;
      if(!jugador) mensaje("Selecciona un jugador desde el menú.","error");
    }
    $("volver").addEventListener("click",()=>{
      location.href=modo==="jugador"?"selector.html":"menu_principal.html";
    });
    $("filtros").addEventListener("submit",async e=>{
      e.preventDefault();if(ocupado) return;
      const sesion=JSON.parse(sessionStorage.getItem("rvb_coach_sesion")||"null");
      if(!sesion?.token){location.replace("index.html");return;}
      if(modo==="jugador"&&!jugador){mensaje("No hay jugador seleccionado.","error");return;}
      ocupado=true;
      $("consultar").disabled=true;
      $("consultar").textContent="Consultando...";
      $("listado").replaceChildren();
      mensaje(modo === "jugador"
        ? "Buscando las últimas entradas de RPE y sus documentos en Drive..."
        : "Buscando las últimas sesiones y sus documentos en Drive...");
      try{
        const respuesta=await pedirSesiones({
          token:sesion.token,
          modo,
          equipo:$("equipo").value,
          entrenamiento:$("entrenamiento").value,
          fecha:$("fecha").value,
          usuario:modo==="jugador"?jugador:""
        });
        if(!respuesta?.ok) throw new Error(respuesta?.error||"La consulta ha fallado.");
        renderizar(respuesta.registros||[]);
        mensaje(`${(respuesta.registros||[]).length} sesión(es) encontrada(s).`,"ok");
      }catch(err){
        mensaje(err.message||"No se pudieron consultar los registros.","error");
      }finally{
        ocupado=false;
        $("consultar").disabled=false;
        $("consultar").textContent="Consultar sesiones";
      }
    });
  });
})();
