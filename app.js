(() => {
  "use strict";
  const cfg = window.IC_CONFIG || {};
  const message = document.getElementById("message");
  const signin = document.getElementById("signin");
  const signout = document.getElementById("signout");
  const identity = document.getElementById("identity");

  const configured = Boolean(cfg.clientId && cfg.tenantId);

  if (!configured) return;
  if (!window.msal) { message.textContent = "No se pudo cargar MSAL.js. Verifica la conexión."; return; }
  const client = new msal.PublicClientApplication({
    auth: { clientId: cfg.clientId, authority: `https://login.microsoftonline.com/${cfg.tenantId}`, redirectUri: location.origin + location.pathname },
    cache: { cacheLocation: "sessionStorage" }
  });
  const scopes = [`api://${cfg.apiClientId || cfg.clientId}/access_as_user`];
  async function showSession(account) {
    if (!account) return;
    identity.textContent = account.name || account.username;
    signin.hidden = true;
    signout.hidden = false;
    message.textContent = "Identidad verificada. Comprobando permisos del servidor…";
    try {
      const token = await client.acquireTokenSilent({ account, scopes });
      const response = await fetch(`${cfg.apiBaseUrl.replace(/\/$/, "")}/api/me`, { headers: { Authorization: `Bearer ${token.accessToken}` } });
      if (!response.ok) throw new Error(`Acceso denegado o servicio no disponible (${response.status})`);
      const data = await response.json();
      message.textContent = `Acceso autorizado. Perfil: ${data.role || "sin asignar"}.`;
      // No renderizar módulos con datos hasta que sus endpoints y autorizaciones estén implementados.
    } catch (err) { message.textContent = `No se pudo validar el acceso: ${err.message}`; }
  }
  signin.disabled = false;
  message.textContent = "Inicia sesión para verificar tu identidad y tus permisos.";
  signin.addEventListener("click", async () => {
    signin.disabled = true;
    try { await client.loginRedirect({ scopes }); }
    catch (err) { message.textContent = `Error de autenticación: ${err.message}`; signin.disabled = false; }
  });
  signout.addEventListener("click", () => client.logoutRedirect({ account: client.getActiveAccount() || client.getAllAccounts()[0] }));
  client.handleRedirectPromise().then(result => {
    if (result?.account) client.setActiveAccount(result.account);
    const account = client.getActiveAccount() || client.getAllAccounts()[0];
    if (account) showSession(account);
  }).catch(err => { message.textContent = `Error al procesar el inicio de sesión: ${err.message}`; });
})();
