import { useTeams } from '@microsoft/teamsfx-react'
import { useEffect, useState } from 'react'
import { msalInstance } from '../browser-auth'
import { AccountInfo } from '@azure/msal-browser'
import getAccesToken from '../infrastructure/api/access_token'

export interface IUserInfo {
    login: string
    name: string
    initialLetters: string
    perfilDev: boolean
    perfilPreview: boolean
    perfilDevOrPreview: boolean
}

const PERFIL_DEV = 'P400S1'
const PERFIL_PREVIEW = 'P400S3'

export function getUserInfoFromTeamsAccessToken(accessToken: string): IUserInfo {
    const parseJwt = (token: string) => {
        try {
            return JSON.parse(window.atob(token.split('.')[1]))
        } catch (error) {
            return `Erro ao decodificiar o access token: ${error}`
        }
    }
    const claims = parseJwt(accessToken)
    const siga_roles = get_siga_roles(claims.siga_roles)
    const login = claims.preferred_username
    const name = claims.name
    const perfilDev = siga_roles.includes(PERFIL_DEV)
    const perfilPreview = siga_roles.includes(PERFIL_PREVIEW)
    const perfilDevOrPreview = siga_roles.includes(PERFIL_DEV) || siga_roles.includes(PERFIL_PREVIEW)
    const initialLetters = extrairIniciais(name)
    return {
        login,
        name,
        initialLetters,
        perfilDev,
        perfilPreview,
        perfilDevOrPreview
    }
}

export function getUserInfoFromBrowserAccountInfo(accountInfo?: AccountInfo | null) {
    const accountClaims = accountInfo?.idTokenClaims || {}
    const siga_roles = get_siga_roles(accountClaims.siga_roles as string[])
    const login = accountInfo?.username || ''
    const name = accountInfo?.name || ''
    const PERFIL_DEV = 'P400S1'
    const PERFIL_PREVIEW = 'P400S3'
    const perfilDev = siga_roles.includes(PERFIL_DEV)
    const perfilPreview = siga_roles.includes(PERFIL_PREVIEW)
    const perfilDevOrPreview = siga_roles.includes(PERFIL_DEV) || siga_roles.includes(PERFIL_PREVIEW)
    const initialLetters = extrairIniciais(name || '')
    return {
        login,
        name,
        initialLetters,
        perfilDev,
        perfilPreview,
        perfilDevOrPreview
    }
}

export function get_siga_roles(siga_roles: string[]) {
    if (process.env.REACT_APP_PROFILE === 'local') {
        if (process.env.REACT_APP_SIGA_PROFILE === 'PERFIL_DEV') {
            return [PERFIL_DEV]
        } else if (process.env.REACT_APP_SIGA_PROFILE === 'PERFIL_PREVIEW') {
            return [PERFIL_PREVIEW]
        } else if (process.env.REACT_APP_SIGA_PROFILE === 'PERFIL_COMUM') {
            return []
        }
    }
    return siga_roles
}

export function extrairIniciais(nome: string) {
    nome = nome.replace(/\s(de|da|dos|das)\s/g, ' ') // Remove os 'de', 'da', 'dos', 'das'
    const iniciais = nome.match(/\b(\w)/gi) // Iniciais de cada parte do nome.
    if (iniciais) {
        const iniciaisConcatenados = [iniciais[0], iniciais[iniciais.length - 1]].join('').toUpperCase() //concatena as iniciais do primeiro e último nome e as deixa MAIUSCULA
        return iniciaisConcatenados
    }
    return ''
}

export function useUserInfo() {
    const [{ inTeams }] = useTeams()

    const [userInfo, setUserInfo] = useState<IUserInfo>({
        login: '',
        name: '',
        perfilDev: false,
        perfilPreview: false,
        perfilDevOrPreview: false,
        initialLetters: ''
    })
    useEffect(() => {
        async function getUserInfoFromTeams() {
            try {
                const accessToken = await getAccesToken()
                const userInfo = getUserInfoFromTeamsAccessToken(accessToken)
                setUserInfo(userInfo)
            } catch (error) {
                console.log('Erro ao obter userInfo:', error)
            }
        }
        if (inTeams === true) {
            getUserInfoFromTeams()
        } else if (inTeams === false) {
            const account = msalInstance.getActiveAccount()
            const userInfo = getUserInfoFromBrowserAccountInfo(account)
            setUserInfo(userInfo)
        }
    }, [inTeams])

    return userInfo
}
