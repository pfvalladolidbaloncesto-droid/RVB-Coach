/* Coach RVB - protección de navegación (versión 1).
   Esto no sustituye la validación del token en Apps Script. */
(function () {
  const CLAVE = "rvb_coach_sesion";
  let sesion = null;
  try { sesion = JSON.parse(sessionStorage.getItem(CLAVE) || "null"); }
  catch (_) { sesion = null; }

  const valida = !!(
    sesion &&
    typeof sesion.token === "string" &&
    /^RVB_[0-9a-f]{64}$/.test(sesion.token) &&
    typeof sesion.usuario === "string" && sesion.usuario.trim() &&
    typeof sesion.exp === "number" &&
    sesion.exp > Date.now()
  );

  if (!valida) {
    sessionStorage.removeItem(CLAVE);
    document.documentElement.style.visibility = "hidden";
    window.location.replace("index.html");
  }
})();
