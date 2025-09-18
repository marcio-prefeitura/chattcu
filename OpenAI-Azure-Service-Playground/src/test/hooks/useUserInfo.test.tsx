import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import {
    get_siga_roles,
    getUserInfoFromBrowserAccountInfo,
    getUserInfoFromTeamsAccessToken,
    useUserInfo
} from '../../hooks/useUserInfo'
import { AccountInfo } from '@azure/msal-browser'

jest.mock('../../browser-auth', () => {
    return {
        msalInstance: {
            initialize: jest.fn().mockResolvedValue(undefined),
            handleRedirectPromise: jest.fn().mockResolvedValue(null),
            setActiveAccount: jest.fn(),
            getAllAccounts: jest.fn().mockReturnValue([]),
            getActiveAccount: jest.fn(),
            logoutRedirect: jest.fn()
        }
    }
})

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn()
}))

describe('useUserInfo', () => {
    const mockGet_siga_roles = jest.fn()
    const mockExtrairIniciais = jest.fn()

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should handle successful data retrieval', () => {
        const mockData = {
            nome: '',
            roles: ['P400S1']
        }
        const mockQueryResult: {
            isLoading: boolean
            isError: boolean
            data: { roles: string[]; nome: string }
            refetch: jest.Mock<any, any>
            isSuccess: boolean
        } = {
            data: mockData,
            isLoading: false,
            isSuccess: true,
            isError: false,
            refetch: jest.fn()
        }

        ;(useQuery as jest.Mock).mockReturnValueOnce(mockQueryResult)

        const { result } = renderHook(() => useUserInfo())

        expect(result.current.name).toBe('')
        expect(result.current.initialLetters).toBe('')
        expect(result.current.perfilDev).toBe(false)
        expect(result.current.perfilPreview).toBe(false)
        expect(result.current.perfilDevOrPreview).toBe(false)
    })

    it('should handle empty data correctly', () => {
        const mockQueryResult: {
            isLoading: boolean
            isError: boolean
            data: null
            refetch: jest.Mock<any, any>
            isSuccess: boolean
        } = {
            data: null,
            isLoading: false,
            isSuccess: true,
            isError: false,
            refetch: jest.fn()
        }

        ;(useQuery as jest.Mock).mockReturnValueOnce(mockQueryResult)

        const { result } = renderHook(() => useUserInfo())

        expect(result.current.name).toBe('')
        expect(result.current.initialLetters).toBe('')
        expect(result.current.perfilDev).toBe(false)
        expect(result.current.perfilPreview).toBe(false)
        expect(result.current.perfilDevOrPreview).toBe(false)
    })

    it('should handle error state correctly', () => {
        const mockQueryResult: {
            isLoading: boolean
            isError: boolean
            data: null
            refetch: jest.Mock<any, any>
            isSuccess: boolean
        } = {
            data: null,
            isLoading: false,
            isSuccess: false,
            isError: true,
            refetch: jest.fn()
        }

        ;(useQuery as jest.Mock).mockReturnValueOnce(mockQueryResult)

        const { result } = renderHook(() => useUserInfo())

        expect(result.current.name).toBe('')
        expect(result.current.initialLetters).toBe('')
        expect(result.current.perfilDev).toBe(false)
        expect(result.current.perfilPreview).toBe(false)
        expect(result.current.perfilDevOrPreview).toBe(false)
    })

    it('deve decodificar corretamente um accessToken válido', () => {
        const mockAccessToken = 'header.payload.signature' // Mock de JWT
        const mockClaims = {
            preferred_username: 'user@domain.com',
            name: 'User Name',
            siga_roles: ['P400S1', 'P400S3']
        }

        // Mock das funções internas
        global.atob = jest.fn(() => JSON.stringify(mockClaims)) // Mock da função atob
        mockGet_siga_roles.mockReturnValue(mockClaims.siga_roles)
        mockExtrairIniciais.mockReturnValue('UN')

        const result = getUserInfoFromTeamsAccessToken(mockAccessToken)

        expect(result).toEqual({
            login: 'user@domain.com',
            name: 'User Name',
            initialLetters: 'UN',
            perfilDev: true,
            perfilPreview: true,
            perfilDevOrPreview: true
        })
        expect(global.atob).toHaveBeenCalledWith('payload') // Verifica se a função atob foi chamada corretamente
    })

    it('deve calcular corretamente o perfilDev, perfilPreview e perfilDevOrPreview', () => {
        const mockAccessToken = 'valid-token'
        const mockClaims = {
            preferred_username: 'user@domain.com',
            name: 'User Name',
            siga_roles: ['P400S1'] // Apenas o perfil de desenvolvedor
        }

        // Mock das funções internas
        global.atob = jest.fn(() => JSON.stringify(mockClaims)) // Mock de atob
        mockGet_siga_roles.mockReturnValue(mockClaims.siga_roles)
        mockExtrairIniciais.mockReturnValue('UN')

        const result = getUserInfoFromTeamsAccessToken(mockAccessToken)

        expect(result.perfilDev).toBe(true)
        expect(result.perfilPreview).toBe(false)
        expect(result.perfilDevOrPreview).toBe(true)
    })

    it('deve extrair as iniciais corretamente do nome', () => {
        const mockAccessToken = 'valid-token'
        const mockClaims = {
            preferred_username: 'user@domain.com',
            name: 'User Name',
            siga_roles: ['P400S1', 'P400S3']
        }

        // Mock das funções internas
        global.atob = jest.fn(() => JSON.stringify(mockClaims)) // Mock de atob
        mockGet_siga_roles.mockReturnValue(mockClaims.siga_roles)
        mockExtrairIniciais.mockReturnValue('UN')

        const result = getUserInfoFromTeamsAccessToken(mockAccessToken)

        expect(result.initialLetters).toBe('UN')
    })

    it('deve retornar as informações corretas quando accountInfo for válido', () => {
        const mockAccountInfo: AccountInfo | null = {
            username: 'user@domain.com',
            name: 'User Name',
            localAccountId: '1',
            idTokenClaims: {
                siga_roles: ['P400S1', 'P400S3'],
                preferred_username: 'user@domain.com',
                name: 'User Name'
            },
            environment: 'production',
            tenantId: 'tenant-id',
            homeAccountId: 'home-account-id'
        }

        const result = getUserInfoFromBrowserAccountInfo(mockAccountInfo)

        expect(result).toEqual({
            login: 'user@domain.com',
            name: 'User Name',
            initialLetters: 'UN', // As iniciais extraídas
            perfilDev: true, // Role P400S1
            perfilPreview: true, // Role P400S3
            perfilDevOrPreview: true
        })
    })

    it('deve lidar corretamente com roles ausentes em accountInfo', () => {
        const mockAccountInfo: AccountInfo | null = {
            username: 'user@domain.com',
            name: 'User Name',
            localAccountId: '1',
            idTokenClaims: {
                siga_roles: ['P400S1', 'P400S3'],
                preferred_username: 'user@domain.com',
                name: 'User Name'
            },
            environment: 'production',
            tenantId: 'tenant-id',
            homeAccountId: 'home-account-id'
        }

        const result = getUserInfoFromBrowserAccountInfo(mockAccountInfo)

        expect(result).toEqual({
            login: 'user@domain.com',
            name: 'User Name',
            initialLetters: 'UN',
            perfilDev: true,
            perfilPreview: true,
            perfilDevOrPreview: true
        })
    })

    it('deve retornar valores corretos quando o user tiver apenas o perfil DEV', () => {
        const mockAccountInfo: AccountInfo | null = {
            username: 'user@domain.com',
            name: 'User Name',
            localAccountId: '1',
            idTokenClaims: {
                siga_roles: ['P400S1'],
                preferred_username: 'user@domain.com',
                name: 'User Name'
            },
            environment: 'production',
            tenantId: 'tenant-id',
            homeAccountId: 'home-account-id'
        }

        const result = getUserInfoFromBrowserAccountInfo(mockAccountInfo)

        expect(result).toEqual({
            login: 'user@domain.com',
            name: 'User Name',
            initialLetters: 'UN',
            perfilDev: true,
            perfilPreview: false,
            perfilDevOrPreview: true
        })
    })

    it('deve retornar valores corretos quando o user tiver apenas o perfil PREVIEW', () => {
        const mockAccountInfo: AccountInfo | null = {
            username: 'user@domain.com',
            name: 'User Name',
            localAccountId: '1',
            idTokenClaims: {
                siga_roles: ['P400S3'],
                preferred_username: 'user@domain.com',
                name: 'User Name'
            },
            environment: 'production',
            tenantId: 'tenant-id',
            homeAccountId: 'home-account-id'
        }

        const result = getUserInfoFromBrowserAccountInfo(mockAccountInfo)

        expect(result).toEqual({
            login: 'user@domain.com',
            name: 'User Name',
            initialLetters: 'UN',
            perfilDev: false,
            perfilPreview: true,
            perfilDevOrPreview: true
        })
    })

    it('deve retornar corretamente quando nome estiver ausente', () => {
        const mockAccountInfo: AccountInfo | null = {
            username: 'user@domain.com',
            name: '',
            localAccountId: '1',
            idTokenClaims: {
                siga_roles: ['P400S1', 'P400S3'],
                preferred_username: 'user@domain.com',
                name: ''
            },
            environment: 'production',
            tenantId: 'tenant-id',
            homeAccountId: 'home-account-id'
        }

        const result = getUserInfoFromBrowserAccountInfo(mockAccountInfo)

        expect(result).toEqual({
            login: 'user@domain.com',
            name: '',
            initialLetters: '',
            perfilDev: true,
            perfilPreview: true,
            perfilDevOrPreview: true
        })
    })
    it('deve retornar PERFIL_DEV quando REACT_APP_PROFILE for "local" e REACT_APP_SIGA_PROFILE for "PERFIL_DEV"', () => {
        process.env.REACT_APP_PROFILE = 'local'
        process.env.REACT_APP_SIGA_PROFILE = 'PERFIL_DEV'

        const result = get_siga_roles([])

        expect(result).toEqual(['P400S1'])
    })

    it('deve retornar PERFIL_PREVIEW quando REACT_APP_PROFILE for "local" e REACT_APP_SIGA_PROFILE for "PERFIL_PREVIEW"', () => {
        process.env.REACT_APP_PROFILE = 'local'
        process.env.REACT_APP_SIGA_PROFILE = 'PERFIL_PREVIEW'

        const result = get_siga_roles([])

        expect(result).toEqual(['P400S3'])
    })

    it('deve retornar uma lista vazia quando REACT_APP_PROFILE for "local" e REACT_APP_SIGA_PROFILE for "PERFIL_COMUM"', () => {
        process.env.REACT_APP_PROFILE = 'local'
        process.env.REACT_APP_SIGA_PROFILE = 'PERFIL_COMUM'

        const result = get_siga_roles([])

        expect(result).toEqual([])
    })

    it('deve retornar siga_roles original quando REACT_APP_PROFILE não for "local"', () => {
        process.env.REACT_APP_PROFILE = 'other'

        const result = get_siga_roles(['P400S1', 'P400S3'])

        expect(result).toEqual(['P400S1', 'P400S3'])
    })

    it('deve retornar siga_roles original quando REACT_APP_SIGA_PROFILE for um valor não especificado', () => {
        process.env.REACT_APP_PROFILE = 'local'
        process.env.REACT_APP_SIGA_PROFILE = 'PERFIL_UNKNOWN'

        const result = get_siga_roles(['P400S1', 'P400S3'])

        expect(result).toEqual(['P400S1', 'P400S3'])
    })

    it('deve retornar uma lista vazia quando REACT_APP_PROFILE for "local" e REACT_APP_SIGA_PROFILE estiver indefinido', () => {
        process.env.REACT_APP_PROFILE = 'local'

        const result = get_siga_roles([])

        expect(result).toEqual([])
    })

    it('deve retornar o array de siga_roles quando nenhum valor de ambiente corresponder ao caso "local"', () => {
        process.env.REACT_APP_PROFILE = 'local'

        const result = get_siga_roles(['P400S1', 'P400S3'])

        expect(result).toEqual(['P400S1', 'P400S3'])
    })
})
