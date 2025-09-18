// https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/default/auth.js
import { AuthenticationResult, Configuration, PublicClientApplication } from '@azure/msal-browser'

const msalConfig: Configuration = {
    auth: {
        authority: process.env.REACT_APP_OAUTH_AUTHORITY,
        clientId: process.env.REACT_APP_BROWSER_CLIENT_ID || ''
    }
}

export const msalInstance = new PublicClientApplication(msalConfig)
msalInstance.initialize().then(() => {
    // Once login is successful and redirects with tokens
    // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#i-dont-understand-the-redirect-flow-how-does-the-handleredirectpromise-function-work
    msalInstance
        .handleRedirectPromise()
        .then(handleResponse)
        .catch(err => {
            console.error(err)
        })
})

function handleResponse(resp: AuthenticationResult | null) {
    if (resp !== null) {
        msalInstance.setActiveAccount(resp.account)
    } else {
        const currentAccounts = msalInstance.getAllAccounts()
        if (!currentAccounts || currentAccounts.length < 1) {
            return
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const activeAccount = currentAccounts[0]
            msalInstance.setActiveAccount(activeAccount)
        }
    }
}
export const logOut = async () => {
    const accountFilter = {
        homeAccountId: msalInstance.getActiveAccount()?.homeAccountId
    }
    const logoutRequest = {
        account: msalInstance.getAccount(accountFilter)
    }
    await msalInstance.logoutRedirect(logoutRequest)
}
