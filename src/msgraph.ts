import * as msal from "@azure/msal-browser";

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
    redirect_uri: window.location.href //'https://192.168.1.2:3000',
  }
  // if (account.accessToken) {
  //   return
  // }
  if (account.username) {
    const currentAccount = msalInstance.getAccountByUsername(account.username)
    return msalInstance.acquireTokenSilent({...loginRequest, account: currentAccount }).then(resp => {
      setAccount(resp)
    }).catch((err) => {
      if (err instanceof msal.InteractionRequiredAuthError) {
        return msalInstance.acquireTokenRedirect({...loginRequest, loginHint: currentAccount.username });
      }
      throw err
    })
  } else {
    return msalInstance.loginRedirect({...loginRequest });
  }
}

export async function reqToken () {
  if (account.accessToken)  return
  return msLogin()
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
