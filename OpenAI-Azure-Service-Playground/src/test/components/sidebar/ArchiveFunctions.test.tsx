import { waitFor, renderHook, act } from '@testing-library/react'
import { useArchiveFunctions } from '../../../components/sidebar/archive/ArchiveFunctions'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { IChat } from '../../../infrastructure/utils/types'

jest.mock('../../../context/AlertContext', () => ({
    useAlert: jest.fn()
}))

jest.mock('../../../infrastructure/api', () => ({
    apagarChat: jest.fn(), // Mock the apagarChat function
    mutateArchiveChat: jest.fn().mockResolvedValue({ mensagem: 'Chat arquivado com sucesso!' }),
    listChatsPaginado: jest.fn(),
    archiveChatNew: jest.fn(),
    UnArchiveDeleteAll: jest.fn()
}))

describe('Archive Functions', () => {
    let mockHandleAlert: jest.Mock
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = new QueryClient()
        mockHandleAlert = jest.fn()
        require('../../../context/AlertContext').useAlert.mockReturnValue({
            handleAlert: mockHandleAlert
        })

        jest.mock('@tanstack/react-query', () => ({
            useInfiniteQuery: jest.fn().mockReturnValue({
                data: {
                    pages: [
                        {
                            total: 2, // Mock total as expected by your code
                            chats: [
                                { id: '1', arquivado: true },
                                { id: '2', arquivado: true }
                            ]
                        }
                    ]
                },
                hasNextPage: false,
                fetchNextPage: jest.fn(),
                isFetchingNextPage: false
            }),
            useMutation: jest.fn(),
            useQueryClient: jest.fn(() => ({
                invalidQueries: jest.fn(),
                setQueryData: jest.fn(),
                getQueryData: jest.fn()
            }))
        }))
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    )

    it('should handle error during archive chat mutation', async () => {
        const mockError: AxiosError = {
            message: 'Error',
            name: 'AxiosError',
            isAxiosError: true,
            config: {},
            response: { status: 500, data: {} }
        } as any
        const { archiveChatNew } = require('../../../infrastructure/api')

        archiveChatNew.mockRejectedValue(mockError)
        const createMockChat = (overrides: Partial<IChat> = {}): IChat => ({
            id: '1',
            arquivado: true,
            mensagens: [],
            isLoading: false,
            data_ultima_iteracao: new Date(),
            ...overrides
        })
        const mockChat = createMockChat({ id: '2' }) // Customize as needed
        const { result } = renderHook(() => useArchiveFunctions('', mockChat), { wrapper })
        await result.current.handleArchiveChat(mockChat)
        await waitFor(() =>
            expect(mockHandleAlert).toHaveBeenCalledWith('error', 'Ocorreu um erro ao arquivar/desarquivar o chat')
        )
    })

    // it('should successfully archive a chat', async () => {
    //     const mockChat = { id: '1', arquivado: true } as IChat
    //     const { archiveChatNew } = require('../../../infrastructure/api')
    //     archiveChatNew.mockResolvedValue({ mensagem: 'Chat arquivado com sucesso!' })
    //     const { result } = renderHook(() => useArchiveFunctions('', mockChat), { wrapper })
    //     await act(async () => {
    //         await result.current.handleArchiveChat(mockChat)
    //     })
    //     expect(mockChat.arquivado).toBe(true)
    //     expect(mockHandleAlert).toHaveBeenCalledWith('info', 'Chat arquivado')
    // })
})
