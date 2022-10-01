import * as msal from "@azure/msal-browser";
const LoginMode = import.meta.env['VITE_MSLOGIN']

const msalConfig = {
  auth: {
    clientId: 'b0c0fce1-b6ae-4be1-b613-037ded2f9a1d'
  },
  cache: {
    cacheLocation: "localStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  }
}
const graphApiRoot = "https://graph.microsoft.com/v1.0/me"

export const msalInstance = new msal.PublicClientApplication(msalConfig)
msalInstance.handleRedirectPromise()
  .then(handleResponse)
  .catch(console.error)

function handleResponse(resp: msal.AuthenticationResult) {
    if (resp !== null) {
      setAccount(resp)
    } else {
      selectAccount()
    }
}

export const account = {
  accessToken: '',
  username: '',
  name: ''
}

function setAccount(resp) {
  account.accessToken = resp.accessToken
  account.username = resp.account.username
  account.name = resp.account.name
}
function selectAccount () {
    /**
     * See here for more info on account retrieval: 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    const currentAccounts = msalInstance.getAllAccounts();
    if (!currentAccounts || currentAccounts.length < 1) {
        return
    } else if (currentAccounts.length > 1) {
        // Add your account choosing logic here
        console.warn("Multiple accounts detected.");
    } else if (currentAccounts.length === 1) {
      account.username = currentAccounts[0].username;
    }
}

export async function msLogin() {
  const loginRequest = {
    scopes: ['files.read.all'],// optional Array<string>
    redirect_uri: import.meta.env.VITE_REDIRECT_URI ?? window.location.href
  }
  // if (account.accessToken) {
  //   return
  // }
  if (account.username) {
    const currentAccount = msalInstance.getAccountByUsername(account.username)
    return msalInstance.acquireTokenSilent({...loginRequest, account: currentAccount }).then(resp => {
      setAccount(resp)
    }).catch(async (err) => {
      if (err instanceof msal.InteractionRequiredAuthError) {
        if (LoginMode === 'popup') {
          return msalInstance.acquireTokenPopup({...loginRequest, loginHint: currentAccount.username})
        }
        return msalInstance.acquireTokenRedirect({...loginRequest, loginHint: currentAccount.username});
      }
      throw err
    })
  } else {
    if (LoginMode === 'popup') {
      return msalInstance.loginPopup({...loginRequest }).then(handleResponse)
    } else {
      return msalInstance.loginRedirect({...loginRequest });
    }
  }
}

export async function reqToken () {
  if (account.accessToken)  return
  return msLogin()
}

export async function logout() {
  if (LoginMode === 'popup') {
    return msalInstance.logoutPopup() 
  } else {
    return msalInstance.logoutRedirect()
  }
}

function getHeaders() {
  const headers = new Headers();
  const bearer = "Bearer " + account.accessToken;
  headers.append("Authorization", bearer);
  return headers
}

export function profile() {
  const headers = new Headers();
  const bearer = "Bearer " + account.accessToken;
  headers.append("Authorization", bearer);
  const options = {
          method: "GET",
          headers: headers
  };
  return fetch(graphApiRoot, options)
}

function getApiPath (path: string = '/') {
  return path === '/' ? '' : `:${path}:`
}
export async function getList(path: string) {
  const apiPath = getApiPath(path)
  const headers = new Headers();
  const bearer = "Bearer " + account.accessToken;
  headers.append("Authorization", bearer);
  const options = {
          method: "GET",
          headers: headers
  };
  return fetch(`${graphApiRoot}/drive/root${apiPath}?expand=children`, options).then(res => res.json())
}

export async function getItem(path: string) {
  const apiPath = getApiPath(path)
  const options = {
          method: "GET",
          headers: getHeaders()
  }
  return fetch(`${graphApiRoot}/drive/root${apiPath}?expand=children`, options).then(res => res.json())
}
