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

  function renderizar(registros) {
    const area = $("listado");
    area.replaceChildren();
    if (!registros.length) {
      const p=document.createElement("p");
      p.className="ayuda";
      p.textContent="No hay sesiones que coincidan con los filtros.";
      area.appendChild(p);
      return;
    }
    for(const r of registros) {
      const articulo=document.createElement("article");
      const primera=document.createElement("div"); primera.className="fila";
      const titulo=document.createElement("strong"); titulo.textContent=r.fechaTexto + " · " + r.equipo;
      const tipo=document.createElement("span"); tipo.className="tipo";tipo.textContent=r.entrenamiento;
      primera.append(titulo,tipo);
      const detalles=document.createElement("p");detalles.className="detalles";
      detalles.textContent="Duración: " + (r.volumen === "" ? "Sin indicar" : r.volumen + " min");
      articulo.append(primera,detalles);
      if(r.documento && r.documento.url){
        const a=document.createElement("a");
        a.className="archivo";
        a.href=r.documento.url;
        a.target="_blank";a.rel="noopener noreferrer";
        a.textContent="Abrir sesión · " + r.documento.nombre;
        articulo.appendChild(a);
      }else{
        const span=document.createElement("span");span.className="sinarchivo";
        span.textContent="Sin documento de sesión en Drive";
        articulo.appendChild(span);
      }
      area.appendChild(articulo);
    }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    $("titulo").textContent=modo==="jugador"?"Sesiones Jugador":"Sesiones Equipo";
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
      mensaje("Buscando las últimas sesiones y sus documentos en Drive...");
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
        mensaje(err.message||"No se pudo consultar la hoja Sesion.","error");
      }finally{
        ocupado=false;
        $("consultar").disabled=false;
        $("consultar").textContent="Consultar sesiones";
      }
    });
  });
})();
