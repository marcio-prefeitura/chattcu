import { renderHook } from '@testing-library/react'
import { listChatMessages } from '../../infrastructure/api'
import { useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IChat } from '../../infrastructure/utils/types'
import { useFetchChat } from '../../hooks/useFetchChat'

jest.mock('../../infrastructure/api', () => ({
    listChatMessages: jest.fn()
}))

jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn()
}))

const queryClient = new QueryClient()

describe('useFetchChat', () => {
    const mockNavigate = jest.fn()
    const mockHandleAlert = jest.fn()
    const mockChatsHistory: IChat[] = [
        {
            id: '1',
            titulo: 'Chat 1',
            usuario: 'Usuário 1',
            mensagens: [],
            apagado: false,
            fixado: false,
            arquivado: true,
            deleting: false,
            editing: false,
            data_criacao: new Date('2024-11-01T08:00:00Z'),
            data_ultima_iteracao: new Date('2024-11-01T09:00:00Z'),
            temp_chat_id: 'temp-1',
            isLoading: false,
            isStreamActive: false,
            numWords: 100,
            trechos: [],
            arquivos_busca: '',
            especialista_utilizado: null,
            modelo_selecionado: null,
            shared: false
        },
        {
            id: '2',
            titulo: 'Chat 2',
            usuario: 'Usuário 2',
            mensagens: [],
            apagado: false,
            fixado: false,
            arquivado: true,
            deleting: false,
            editing: false,
            data_criacao: new Date('2024-10-01T08:00:00Z'),
            data_ultima_iteracao: new Date('2024-10-01T09:00:00Z'),
            temp_chat_id: 'temp-2',
            isLoading: false,
            isStreamActive: false,
            numWords: 50,
            trechos: [],
            arquivos_busca: '',
            especialista_utilizado: null,
            modelo_selecionado: null,
            shared: false
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    })

    it('deve retornar sucesso quando o chat existe no histórico', async () => {
        const mockedlistChatMessages = listChatMessages as jest.Mock
        mockedlistChatMessages.mockResolvedValue({ id: '1', titulo: 'Chat 1' })

        const { result } = renderHook(() => useFetchChat(mockHandleAlert, mockChatsHistory), {
            wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        })

        const response = await result.current.mutateAsync('1')

        expect(listChatMessages).toHaveBeenCalledWith('1')
        expect(response).toEqual({ id: '1', titulo: 'Chat 1' })
        expect(mockNavigate).toHaveBeenCalledWith('/chat/1')
        expect(mockHandleAlert).not.toHaveBeenCalled()
    })

    it('deve retornar sucesso quando o chat não está no histórico', async () => {
        const mockedlistChatMessages = listChatMessages as jest.Mock
        mockedlistChatMessages.mockResolvedValue({ id: '3', name: 'Chat 3' })

        const { result } = renderHook(() => useFetchChat(mockHandleAlert, mockChatsHistory), {
            wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        })

        const response = await result.current.mutateAsync('3')

        expect(listChatMessages).toHaveBeenCalledWith('3')
        expect(response).toEqual({ id: '3', name: 'Chat 3' })
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(mockHandleAlert).not.toHaveBeenCalled()
    })

    it('deve retornar erro ao buscar o chat', async () => {
        const mockedlistChatMessages = listChatMessages as jest.Mock
        mockedlistChatMessages.mockRejectedValue(new Error('API error'))

        const { result } = renderHook(() => useFetchChat(mockHandleAlert, mockChatsHistory), {
            wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        })

        await expect(result.current.mutateAsync('4')).rejects.toThrow('API error')

        expect(listChatMessages).toHaveBeenCalledWith('4')
        expect(mockHandleAlert).toHaveBeenCalledWith(
            'error',
            'Erro ao carregar o chat original. Por favor, tente novamente.'
        )
        expect(mockNavigate).not.toHaveBeenCalled()
    })
})
