
(() => {
  "use strict";

  const cfg = window.IC_CONFIG || {};
  const message = document.getElementById("message");
  const signin = document.getElementById("signin");
  const signout = document.getElementById("signout");
  const identity = document.getElementById("identity");

  function status(text) {
    if (message) message.textContent = text;
  }

  if (!signin || !signout || !identity || !message) {
    console.error("Faltan elementos del formulario de acceso.");
    return;
  }

  if (!cfg.clientId || !cfg.tenantId) {
    status("Falta configurar Microsoft Entra ID.");
    return;
  }

  if (!window.msal?.PublicClientApplication) {
    status("Error: MSAL.js no está cargando.");
    console.error("No se encontró window.msal");
    return;
  }

  const client = new msal.PublicClientApplication({
    auth: {
      clientId: cfg.clientId,
      authority:
        `https://login.microsoftonline.com/${cfg.tenantId}`,
      redirectUri:
        "https://anthonyscubas.github.io/evaluacion-icV2/"
    },
    cache: {
      cacheLocation: "sessionStorage"
    }
  });

  // Solo autenticación de identidad.
  // La autorización de la API se configurará después.
  const loginRequest = {
    scopes: ["openid", "profile"]
  };

  async function showSession(account) {
    identity.textContent =
      account.name || account.username || "Usuario";

    signin.hidden = true;
    signout.hidden = false;

    if (!cfg.apiBaseUrl || !cfg.apiClientId) {
      status(
        "Sesión Microsoft iniciada correctamente. " +
        "Los módulos permanecerán bloqueados hasta " +
        "configurar y validar los permisos en la API."
      );
      return;
    }

    status(
      "Identidad verificada. Pendiente de implementar " +
      "la validación de roles en el servidor."
    );
  }

  async function start() {
    try {
      const result = await client.handleRedirectPromise();

      if (result?.account) {
        client.setActiveAccount(result.account);
      }

      const account =
        client.getActiveAccount() ||
        client.getAllAccounts()[0];

      if (account) {
        await showSession(account);
        return;
      }

      signin.disabled = false;
      status("Listo para iniciar sesión con Microsoft.");

    } catch (error) {
      console.error("Error MSAL:", error);
      status("Error de autenticación: " + error.message);
      signin.disabled = false;
    }
  }

  signin.addEventListener("click", async () => {
    signin.disabled = true;
    status("Redirigiendo a Microsoft...");

    try {
      await client.loginRedirect(loginRequest);
    } catch (error) {
      console.error(error);
      status("No se pudo iniciar sesión: " + error.message);
      signin.disabled = false;
    }
  });

  signout.addEventListener("click", async () => {
    const account =
      client.getActiveAccount() ||
      client.getAllAccounts()[0];

    await client.logoutRedirect({ account });
  });

  start();
})();
