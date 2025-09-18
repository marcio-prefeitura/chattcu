import * as AccessToken from '../../infrastructure/api/access_token'
import { msalInstance } from '../../browser-auth'
import * as microsoftTeams from '@microsoft/teams-js'

jest.mock('../../browser-auth', () => ({
    msalInstance: {
        getActiveAccount: jest.fn(),
        acquireTokenSilent: jest.fn()
    }
}))

jest.mock('@microsoft/teams-js', () => ({
    app: {
        initialize: jest.fn()
    },
    authentication: {
        getAuthToken: jest.fn()
    }
}))

describe('getAccesToken', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should get token from Teams when in Teams environment', async () => {
        Object.defineProperty(window, 'parent', {
            value: {},
            writable: true
        })

        const mockToken = 'mock-teams-token'
        ;(microsoftTeams.authentication.getAuthToken as jest.Mock).mockResolvedValue(mockToken)

        const token = await AccessToken.default()

        expect(microsoftTeams.app.initialize).toHaveBeenCalled()
        expect(microsoftTeams.authentication.getAuthToken).toHaveBeenCalled()
        expect(token).toBe(mockToken)
    })

    it('should return error message when getAuthToken fails in Teams environment', async () => {
        Object.defineProperty(window, 'parent', {
            value: {},
            writable: true
        })
        const mockError = new Error('Teams initialization failed')
        ;(microsoftTeams.authentication.getAuthToken as jest.Mock).mockRejectedValue(mockError)

        const token = await AccessToken.default()

        expect(microsoftTeams.app.initialize).toHaveBeenCalled()
        expect(microsoftTeams.authentication.getAuthToken).toHaveBeenCalled()
        expect(token).toBe('Erro ao adquirir token: Error: Teams initialization failed')
    })

    it('should get token from msalInstance when not in Teams', async () => {
        Object.defineProperty(window, 'parent', {
            value: window,
            writable: true
        })

        const mockAccount = { username: 'user@example.com' }
        const mockResponse = { accessToken: 'mock-msal-token' }

        ;(msalInstance.getActiveAccount as jest.Mock).mockReturnValue(mockAccount)
        ;(msalInstance.acquireTokenSilent as jest.Mock).mockResolvedValue(mockResponse)

        const token = await AccessToken.default()

        expect(msalInstance.getActiveAccount).toHaveBeenCalled()
        expect(msalInstance.acquireTokenSilent).toHaveBeenCalledWith({
            scopes: process.env.REACT_APP_BROWSER_OAUTH_SCOPES?.split(', ') || [''],
            account: mockAccount
        })
        expect(token).toBe(mockResponse.accessToken)
    })

    it('should throw an error when no active account is found in msalInstance', async () => {
        Object.defineProperty(window, 'parent', {
            value: window,
            writable: true
        })
        ;(msalInstance.getActiveAccount as jest.Mock).mockReturnValue(null)

        await expect(AccessToken.default()).rejects.toThrow('Nenhuma conta ativa!')
    })

    it('should handle error when acquireTokenSilent fails', async () => {
        Object.defineProperty(window, 'parent', {
            value: window,
            writable: true
        })

        const mockAccount = { username: 'user@example.com' }
        ;(msalInstance.getActiveAccount as jest.Mock).mockReturnValue(mockAccount)
        ;(msalInstance.acquireTokenSilent as jest.Mock).mockRejectedValue(new Error('Token acquisition failed'))

        await expect(AccessToken.default()).rejects.toThrow('Token acquisition failed')
    })
})
