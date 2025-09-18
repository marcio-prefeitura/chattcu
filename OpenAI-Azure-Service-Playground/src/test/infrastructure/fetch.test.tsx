import { sendMsgToStream } from '../../infrastructure/api/fetch'
import getAccesToken from '../../infrastructure/api/access_token'
import { Environments } from '../../infrastructure/environments/Environments'
import { IMessageHistory } from '../../infrastructure/utils/types'

jest.mock('../../infrastructure/api/access_token')

describe('sendMsgToStream', () => {
    const mockFetch = jest.fn()
    const mockAbortSignal = new AbortController().signal

    beforeAll(() => {
        global.fetch = mockFetch
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should send a request with the correct parameters', async () => {
        const accessToken = getAccesToken as jest.Mock
        accessToken.mockResolvedValue('mock-access-token')

        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({})
        })

        const prompt: IMessageHistory = {
            papel: 'USER',
            chat_id: '12345',
            conteudo: 'Test content',
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: [],
            tool_selecionada: 'Tool',
            parametro_modelo_llm: 'Param',
            correlacao_chamada_id: '12345'
        }

        const signal = mockAbortSignal

        const envUrl = `${Environments.urlChat}/12345`

        await sendMsgToStream(prompt, signal)

        expect(mockFetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_BACK_ENDPOINT}${envUrl}`,
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer mock-access-token',
                    'X-Client-App': 'chat-tcu-playground'
                },
                body: JSON.stringify({
                    stream: true,
                    prompt_usuario: 'Test content',
                    arquivos_selecionados: [],
                    arquivos_selecionados_prontos: [],
                    tool_selecionada: 'Tool',
                    parametro_modelo_llm: 'Param',
                    correlacao_chamada_id: '12345'
                }),
                signal: mockAbortSignal
            })
        )
    })

    it('should use default URL if chat_id is empty', async () => {
        const accessToken = getAccesToken as jest.Mock
        accessToken.mockResolvedValue('mock-access-token')
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({})
        })

        const prompt: IMessageHistory = {
            papel: 'USER',
            chat_id: '',
            conteudo: 'Test content',
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: [],
            tool_selecionada: 'Tool',
            parametro_modelo_llm: 'Param',
            correlacao_chamada_id: '12345'
        }

        const signal = mockAbortSignal

        const envUrl = `${Environments.urlChat}/`

        await sendMsgToStream(prompt, signal)

        expect(mockFetch).toHaveBeenCalledWith(
            `${process.env.REACT_APP_BACK_ENDPOINT}${envUrl}`,
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer mock-access-token',
                    'X-Client-App': 'chat-tcu-playground'
                },
                body: JSON.stringify({
                    stream: true,
                    prompt_usuario: 'Test content',
                    arquivos_selecionados: [],
                    arquivos_selecionados_prontos: [],
                    tool_selecionada: 'Tool',
                    parametro_modelo_llm: 'Param',
                    correlacao_chamada_id: '12345'
                }),
                signal: mockAbortSignal
            })
        )
    })

    it('should handle fetch failure correctly', async () => {
        const accessToken = getAccesToken as jest.Mock
        accessToken.mockResolvedValue('mock-access-token')

        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.reject(new Error('Network error'))
        })

        const prompt: IMessageHistory = {
            papel: 'USER',
            chat_id: '12345',
            conteudo: 'Test content',
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: [],
            tool_selecionada: 'Tool',
            parametro_modelo_llm: 'Param',
            correlacao_chamada_id: '12345'
        }

        const signal = mockAbortSignal

        try {
            await sendMsgToStream(prompt, signal)
        } catch (error) {
            expect(error).toBeInstanceOf(Error)
        }
    })
})
