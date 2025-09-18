import { msalInstance } from '../../browser-auth'
import * as microsoftTeams from '@microsoft/teams-js'

async function getTokenFromTeams() {
    let accessToken: string
    try {
        await microsoftTeams.app.initialize()
        accessToken = await microsoftTeams.authentication.getAuthToken()
    } catch (error) {
        return `Erro ao adquirir token: ${error}`
    }
    return accessToken
}

export default async function getAccesToken() {
    const inTeams = window.parent !== window
    if (inTeams) {
        return await getTokenFromTeams()
    }
    const account = msalInstance.getActiveAccount()
    if (!account) {
        throw Error('Nenhuma conta ativa!')
    }
    const response = await msalInstance.acquireTokenSilent({
        scopes: process.env.REACT_APP_BROWSER_OAUTH_SCOPES?.split(', ') || [''],
        account: account
    })
    return response.accessToken
}
