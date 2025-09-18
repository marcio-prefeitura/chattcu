import { setError } from '../../../components/chat-box/error/errorHandler'

describe('setError', () => {
    it('should return correct error for 401 status', () => {
        const response = { status: 401 } as Response
        const result = setError(response)

        expect(result.status).toBe(401)
        expect(result.statusText).toBe('Usuário não autenticado. Redirecionando para tela de login...')
    })

    it('should return correct error for 403 status', () => {
        const response = { status: 403 } as Response
        const result = setError(response)

        expect(result.status).toBe(403)
        expect(result.statusText).toBe('Usuário Sem permissão para realizar operação')
    })

    it('should return default error for other status codes', () => {
        const response = { status: 500 } as Response
        const result = setError(response)

        expect(result.status).toBe(500)
        expect(result.statusText).toBe('Ocorreu um erro na sua solicitação, tente novamente')
    })

    it('should return default error for unhandled status codes', () => {
        const response = { status: 404 } as Response
        const result = setError(response)

        expect(result.status).toBe(500)
        expect(result.statusText).toBe('Ocorreu um erro na sua solicitação, tente novamente')
    })
})
