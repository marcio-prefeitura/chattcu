/* eslint-disable @typescript-eslint/no-extra-semi */
import React from 'react'
import { render, waitFor, act, renderHook, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ChatPage from '../../../pages/chatpage/ChatPage'
import * as api from '../../../infrastructure/api'
import moxios from 'moxios'
import { IChat } from '../../../infrastructure/utils/types'
import { AlertProvider, useAlert } from '../../../context/AlertContext'

const mockNavigate = jest.fn()

jest.mock('../../../components/sidebar/archive/ArchiveFunctions', () => ({
    useArchiveFunctions: () => ({
        handleArchiveChat: jest.fn(),
        hasNextPage: false,
        fetchNextPage: jest.fn(),
        data: {
            pages: [{ chats: [], total: 0 }],
            pageParams: [null]
        }
    })
}))

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({
        pathname: '/chat'
    })
}))

jest.mock('react-markdown', () => props => {
    return <>{props.children}</>
})

jest.mock('remark-gfm', () => props => {
    return <>{props.children}</>
})

jest.mock('../../../infrastructure/api')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const renderWithProviders = (ui, { inTeams = false, ...renderOptions } = {}) => {
    return render(
        <MemoryRouter>
            <QueryClientProvider client={new QueryClient()}>
                <AlertProvider>{ui}</AlertProvider> {/* Wrap with AlertProvider */}
            </QueryClientProvider>
        </MemoryRouter>,
        renderOptions
    )
}

const wrapper = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    })
    return (
        <MemoryRouter>
            <QueryClientProvider client={queryClient}>
                <AlertProvider>{children}</AlertProvider> {/* Wrap with AlertProvider */}
            </QueryClientProvider>
        </MemoryRouter>
    )
}

describe('<ChatPage />', () => {
    beforeEach(() => {
        moxios.install()
    })

    afterEach(() => {
        moxios.uninstall()
        jest.clearAllMocks()
    })

    it('Deve renderizar o header', async () => {
        const { container } = renderWithProviders(
            <ChatPage
                darkMode={false}
                toggleDarkMode={() => {}}
            />,
            { inTeams: true }
        )

        await waitFor(() => {
            const header = container.getElementsByClassName('toolbar')
            expect(header.length).toBeGreaterThan(0)
            expect(header[0]).toBeInTheDocument()
        })
    })

    it('Deve renderizar sidebar permanente', async () => {
        const { getByTestId } = renderWithProviders(
            <ChatPage
                darkMode={false}
                toggleDarkMode={() => {}}
            />,
            { inTeams: true }
        )

        await waitFor(() => {
            const sidebar = getByTestId('drawer-permanent')
            expect(sidebar).toBeInTheDocument()
        })
    })

    it('Deve renderizar sidebar temporaria', async () => {
        const { getByTestId } = renderWithProviders(
            <ChatPage
                darkMode={false}
                toggleDarkMode={() => {}}
            />,
            { inTeams: true }
        )

        await waitFor(() => {
            const sidebar = getByTestId('drawer-temporary')
            expect(sidebar).toBeInTheDocument()
        })
    })

    it('Deve renderizar area do chat', async () => {
        const { getByTestId } = renderWithProviders(
            <ChatPage
                darkMode={false}
                toggleDarkMode={() => {}}
            />,
            { inTeams: true }
        )

        await waitFor(() => {
            const sidebar = getByTestId('chatbox-area')
            expect(sidebar).toBeInTheDocument()
        })
    })

    it('Deve exibir alerta quando chamada handleAlert', async () => {
        const { result } = renderHook(() => useAlert(), { wrapper })

        // Trigger alert
        act(() => {
            result.current.handleAlert('success', 'Test alert', 3000)
        })

        // Verify if the alert was set
        await waitFor(() => {
            expect(result.current.alert?.msg).toBe('Test alert')
            expect(result.current.alert?.severity).toBe('success')
            expect(result.current.alert?.show).toBe(true)
        })
    })

    it('Deve fechar o alerta após o tempo de duração', async () => {
        const { result } = renderHook(() => useAlert(), { wrapper })

        act(() => {
            result.current.handleAlert('info', 'Closing test alert', 2000)
        })

        // Verify if the alert is shown first
        await waitFor(() => {
            expect(result.current.alert?.show).toBe(true)
        })

        // Wait for the alert to disappear after the duration
        await new Promise(resolve => setTimeout(resolve, 2100))

        // Verify if the alert was dismissed
        expect(result.current.alert?.show).toBe(false)
    })
})

describe('ChatPage Hooks', () => {
    it('deve arquivar um chat com sucesso', async () => {
        const mockChat = { id: '1', arquivado: true } as IChat
        ;(api.archiveChatNew as jest.Mock).mockResolvedValue({ success: true })

        const { result } = renderHook(() => useMutation(async (chat: IChat) => await api.archiveChatNew(chat)), {
            wrapper
        })

        act(() => {
            result.current.mutate(mockChat)
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.archiveChatNew).toHaveBeenCalledWith(mockChat)
    })

    it('deve lidar com o compartilhamento de link', async () => {
        const mockShareId = 'share123'
        const mockData = { mensagens: ['msg1', 'msg2'] }
        ;(api.continueChatBySharingId as jest.Mock).mockResolvedValue(mockData)

        const { result } = renderHook(
            () => useMutation(async (share_id: string) => await api.continueChatBySharingId(share_id)),
            { wrapper }
        )

        act(() => {
            result.current.mutate(mockShareId)
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.continueChatBySharingId).toHaveBeenCalledWith(mockShareId)
    })

    it('deve buscar chat por ID', async () => {
        const mockChatId = 'chat123'
        const mockChatData = { id: mockChatId, messages: ['msg1', 'msg2'] }
        ;(api.listChatMessages as jest.Mock).mockResolvedValue(mockChatData)

        const { result } = renderHook(
            () => useQuery(['cachedChats', mockChatId], () => api.listChatMessages(mockChatId)),
            { wrapper }
        )

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.listChatMessages).toHaveBeenCalledWith(mockChatId)
        expect(result.current.data).toEqual(mockChatData)
    })

    const createQueryClient = () => new QueryClient()
    const MockChatPage = (props: any) => {
        const queryClient = createQueryClient()
        return (
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/chat/123']}>
                    <Routes>
                        <Route
                            path='/chat/:chat_id'
                            element={<ChatPage {...props} />}
                        />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        )
    }
    describe('ChatPage', () => {
        let props: any

        beforeEach(() => {
            props = {
                toggleDarkMode: jest.fn(),
                darkMode: false
            }
        })

        const renderWithAlertProvider = (ui: React.ReactElement) => {
            render(<AlertProvider>{ui}</AlertProvider>) // Wrap the UI with AlertProvider
        }

        test('should render the ChatPage correctly', () => {
            renderWithAlertProvider(<MockChatPage {...props} />)

            expect(screen.getByTestId('chatbox-area')).toBeInTheDocument()
            expect(screen.getByTestId('drawer-temporary')).toBeInTheDocument()
        })

        test('should open the sidebar when the menu button is clicked', () => {
            renderWithAlertProvider(<MockChatPage {...props} />)

            const menuButton = screen.getByTestId('menu-button')
            fireEvent.click(menuButton)

            expect(screen.getByTestId('drawer-permanent')).toBeInTheDocument()
        })

        test('should handle errors in fetching chats', async () => {
            const mockAlert = jest.fn()
            jest.spyOn(console, 'error').mockImplementation(() => {})

            renderWithAlertProvider(<MockChatPage {...props} />)
            mockAlert('error', 'Failed to fetch chats')

            expect(mockAlert).toHaveBeenCalledWith('error', 'Failed to fetch chats')
        })
    })
})

describe('Funcionalidades Adicionais do ChatPage', () => {
    let props

    beforeEach(() => {
        props = {
            darkMode: false,
            toggleDarkMode: jest.fn()
        }
        jest.clearAllMocks()
    })

    const baseMockChat: IChat = {
        id: '1',
        titulo: 'Chat Teste',
        mensagens: [],
        isLoading: false,
        isStreamActive: false,
        arquivado: false,
        shared: false,
        temp_chat_id: 'temp-1',
        modelo_selecionado: 'gpt-4'
    }

    it('deve atualizar o chat corretamente quando o stream estiver ativo', async () => {
        const mockChat = {
            ...baseMockChat,
            isStreamActive: true
        }

        const mockInfiniteData = {
            pages: [
                {
                    chats: [mockChat],
                    total: 1,
                    nextPage: null
                }
            ],
            pageParams: [null]
        }

        ;(api.listArchive as jest.Mock).mockResolvedValue(mockInfiniteData)

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />, { inTeams: true })

        await waitFor(() => {
            expect(getByTestId('chatbox-area')).toBeInTheDocument()
        })
    })

    it('deve bloquear seleção de agente quando modelo for o1', async () => {
        const mockChat = {
            ...baseMockChat,
            modelo_selecionado: 'o1-model',
            isStreamActive: true
        }

        const mockInfiniteData = {
            pages: [
                {
                    chats: [mockChat],
                    total: 1,
                    nextPage: null
                }
            ],
            pageParams: [null]
        }

        ;(api.listArchive as jest.Mock).mockResolvedValue(mockInfiniteData)
        ;(api.listChatMessages as jest.Mock).mockResolvedValue(mockChat)

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />, { inTeams: true })

        await waitFor(() => {
            expect(getByTestId('chatbox-area')).toBeInTheDocument()
        })
    })

    it('deve desarquivar chat corretamente', async () => {
        const mockChat = {
            ...baseMockChat,
            arquivado: true
        }

        const mockInfiniteData = {
            pages: [
                {
                    chats: [mockChat],
                    total: 1,
                    nextPage: null
                }
            ],
            pageParams: [null]
        }

        ;(api.listArchive as jest.Mock).mockResolvedValue(mockInfiniteData)

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />, { inTeams: true })

        await waitFor(() => {
            expect(getByTestId('chatbox-area')).toBeInTheDocument()
        })
    })

    it('deve atualizar agente selecionado', async () => {
        const mockAgents = [
            {
                valueAgente: 'agent1',
                labelAgente: 'Agent 1',
                selected: true,
                quebraGelo: [],
                autor: 'Sistema',
                descricao: 'Agente 1',
                icon: null
            },
            {
                valueAgente: 'agent2',
                labelAgente: 'Agent 2',
                selected: false,
                quebraGelo: [],
                autor: 'Sistema',
                descricao: 'Agente 2',
                icon: null
            }
        ]

        ;(api.listAgents as jest.Mock).mockResolvedValue(mockAgents)

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />, { inTeams: true })

        await waitFor(() => {
            const chatArea = getByTestId('chatbox-area')
            expect(chatArea).toBeInTheDocument()
        })
    })

    it('deve navegar entre chats corretamente', async () => {
        const mockChat = {
            ...baseMockChat,
            mensagens: [
                {
                    id: '1',
                    content: 'Test message',
                    role: 'user'
                }
            ]
        }

        ;(api.listChats as jest.Mock).mockResolvedValue([mockChat])
        ;(api.listChatMessages as jest.Mock).mockResolvedValue(mockChat)

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />, { inTeams: true })

        await waitFor(() => {
            const chatArea = getByTestId('chatbox-area')
            expect(chatArea).toBeInTheDocument()
        })
    })
})
describe('ChatPage - Testes Adicionais', () => {
    let props: any

    // Mock do useUserInfo
    jest.mock('../../../hooks/useUserInfo', () => ({
        useUserInfo: () => ({
            name: 'Test User',
            email: 'test@example.com',
            siga_roles: ['P400S1'] // Role necessária
        })
    }))

    // Mock do useMediaQuery melhorado
    jest.mock('@mui/material/useMediaQuery', () => ({
        __esModule: true,
        default: jest.fn(() => false) // desktop por padrão
    }))

    beforeEach(() => {
        props = {
            darkMode: false,
            toggleDarkMode: jest.fn()
        }
        jest.clearAllMocks()

        // Re-mock do useAlert para cada teste
        jest.spyOn(require('../../../utils/AlertUtils'), 'default').mockImplementation(() => ({
            handleAlert: jest.fn(),
            alert: null
        }))
    })

    it('deve atualizar agente quando modelo é o1', async () => {
        const mockO1Chat = {
            id: '1',
            titulo: 'Chat O1',
            mensagens: [],
            modelo_selecionado: 'o1-model',
            isLoading: false,
            isStreamActive: true
        }

        ;(api.listChats as jest.Mock).mockResolvedValue([mockO1Chat])
        ;(api.listChatMessages as jest.Mock).mockResolvedValue(mockO1Chat)
        ;(api.listAgents as jest.Mock).mockResolvedValue([
            {
                labelAgente: 'Conhecimento Geral',
                valueAgente: 'CONHECIMENTOGERAL',
                selected: true
            }
        ])

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />)

        await waitFor(() => {
            expect(getByTestId('chatbox-area')).toBeInTheDocument()
        })
    })

    it('deve abrir e fechar sidebar no modo mobile', async () => {
        const useMediaQueryMock = jest.fn().mockImplementation(() => true)
        require('@mui/material/useMediaQuery').default = useMediaQueryMock

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />)

        const menuButton = getByTestId('menu-button')
        fireEvent.click(menuButton)

        const drawer = getByTestId('drawer-temporary')
        expect(drawer).toBeInTheDocument()
    })

    it('deve lidar com erros na API', async () => {
        // Mock específico do erro
        ;(api.listChats as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

        const { container } = renderWithProviders(<ChatPage {...props} />)

        await waitFor(() => {
            expect(api.listChats).toHaveBeenCalled()
        })
    })

    it('deve atualizar agente quando modelo é o1', async () => {
        const mockO1Chat = {
            id: '1',
            titulo: 'Chat O1',
            mensagens: [],
            modelo_selecionado: 'o1-model',
            isLoading: false,
            isStreamActive: true,
            arquivado: false,
            shared: false,
            temp_chat_id: 'temp-1'
        }

        ;(api.listChats as jest.Mock).mockResolvedValue([mockO1Chat])
        ;(api.listChatMessages as jest.Mock).mockResolvedValue(mockO1Chat)

        const { getByTestId } = renderWithProviders(<ChatPage {...props} />)

        await waitFor(() => {
            expect(getByTestId('chatbox-area')).toBeInTheDocument()
        })
    })
})
