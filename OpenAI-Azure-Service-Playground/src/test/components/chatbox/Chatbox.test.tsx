/* eslint-disable @typescript-eslint/no-extra-semi */
import { MutationCache, QueryCache } from '@tanstack/react-query'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import moxios from 'moxios'

import { IChat } from '../../../infrastructure/utils/types'
import { IUserInfo } from '../../../hooks/useUserInfo'
import { v4 as uuidv4 } from 'uuid'
import { sendMsgToStream } from '../../../infrastructure/api/fetch'
import { ReadableStream } from 'node:stream/web'
import ChatBox from '../../../components/chat-box/ChatBox'
import { TextEncoder } from 'util'
import { ISelectedFiles } from '../../../shared/interfaces/SelectedFiles'
import { msalInstance } from '../../../browser-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockNavigate = jest.fn()
const mockUseLocation = jest.fn()

const mockScrollTo = jest.fn()
HTMLDivElement.prototype.scrollTo = mockScrollTo

const queryCache = new QueryCache()
const mutationCache = new MutationCache()
const queryClient = new QueryClient({ queryCache, mutationCache })
const renderChatBox = (overrides = {}) => {
    const defaultProps = {
        profile: mockProfile, // Ensure profile is passed
        activeChat: {
            id: 'default-chat-id',
            mensagens: [],
            isLoading: false
        },
        setActiveChat: mockSetActiveChat,
        onInitNewChat: () => {},
        inTeams: undefined,
        updateChatStream: () => {},
        setUpdatedFoldersFromChipsActions: () => {},
        filesSelected: [],
        setFilesSelected: () => {},
        onAlert: () => {},
        onUnArchiveChat: () => {},
        setSelectedAgent: mockSetSelectedAgent,
        agentList: [],
        selectedAgent: undefined,
        setAgentList: () => {},
        isSharedChat: false,
        onGoToOriginalChat: mockOnGoToOriginalChat,
        shareId: undefined,
        onContinueConversation: () => {},
        modelChatList: undefined,
        selectedModelChat: undefined,
        setModelChatList: () => {},
        setSelectedModelChat: () => {},
        handleStartShareChat: () => {},
        handleClikShowSidebar: () => {},
        isModelLocked: false,
        setIsModelLocked: () => {}
    }

    const props = { ...defaultProps, ...overrides }

    return render(
        <QueryClientProvider client={queryClient}>
            <ChatBox {...props} />
        </QueryClientProvider>
    )
}
const mockProfile = {
    login: '',
    perfilDev: false,
    perfilDevOrPreview: false,
    perfilPreview: false,
    name: '',
    initialLetters: 'AB' // Ensure this is set to a valid value, even if it's just a placeholder
}

const mockSelectedFiles: ISelectedFiles[] = [
    {
        folder_name: 'Folder 1',
        selected_files: [
            {
                id: 'file1',
                usuario: 'teste',
                id_pasta_pai: '1',
                nome: 'File 1',
                st_removido: false,
                data_criacao: null,
                st_arquivo: true,
                tamanho: 250,
                tipo_midia: 'PDF',
                nome_blob: 'sdasdfas153asdf151sdf',
                status: 'PRONTO',
                selected: true,
                progress: 50,
                show: true
            }
        ]
    }
]
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation
}))

jest.mock('react-markdown', () => props => {
    return <>{props.children}</>
})

jest.mock('remark-gfm', () => props => {
    return <>{props.children}</>
})

jest.mock('../../../components/sidebar/history/AgentAccordion', () => ({
    ...jest.requireActual('../../../components/sidebar/history/AgentAccordion'),
    getAgentByValue: jest.fn()
}))

jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('test-uuid') // Directly mock return value for consistency
}))

jest.mock('../../../infrastructure/api/fetch')
jest.mock('../../../components/chat-box/stream-utils')
const mockSetActiveChat = jest.fn()
const mockSetSelectedAgent = jest.fn()
const mockOnGoToOriginalChat = jest.fn()

describe('<Chatbox />', () => {
    beforeEach(() => {
        moxios.install()
    })

    afterEach(() => {
        moxios.uninstall()
    })

    describe('ChatBox Component', () => {
        it('should render chat input', async () => {
            const activeChat: IChat = {
                id: 'chat1',
                mensagens: [],
                isLoading: false
            }

            const { getByTestId } = renderChatBox({ activeChat })

            await waitFor(() => {
                expect(getByTestId('chat-input')).toBeInTheDocument()
            })
        })

        it('should set selected agent based on the last message specialist', () => {
            const activeChat: IChat = {
                id: 'chat1',
                mensagens: [{ especialista_utilizado: 'agent1', conteudo: 'teste', papel: 'USER' }],
                isLoading: false
            }
            renderChatBox({ activeChat })

            expect(mockSetActiveChat).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'chat1',
                    isLoading: false,
                    mensagens: [{ conteudo: 'teste', especialista_utilizado: 'agent1', papel: 'USER' }],
                    numWords: 1
                })
            )
        })

        it('should update active chat when chat id changes', () => {
            const activeChat: IChat = {
                id: 'chat1',
                mensagens: [],
                isLoading: false
            }

            renderChatBox({ activeChat })

            expect(mockSetActiveChat).toHaveBeenCalledWith(activeChat)
        })

        it('should not scroll to bottom when scrolled up', () => {
            const activeChat: IChat = {
                id: 'chat1',
                mensagens: [],
                isLoading: false
            }

            const { container } = renderChatBox({ activeChat })

            const scrollArea = document.createElement('div')
            scrollArea.className = 'chat-box__scroll-area'
            container.appendChild(scrollArea)

            Object.defineProperty(scrollArea, 'scrollHeight', { value: 1000, writable: true })
            Object.defineProperty(scrollArea, 'clientHeight', { value: 500, writable: true })
            scrollArea.scrollTop = 100

            act(() => {
                scrollArea.dispatchEvent(new Event('scroll'))
            })

            expect(scrollArea.scrollTop).toBe(100)
        })
    })

    describe('submitChatMessage', () => {
        it('should submit a new chat message', async () => {
            const uuidv = uuidv4 as jest.Mock
            uuidv.mockReturnValue('test-uuid')

            const activeChat: IChat = {
                id: 'chat1',
                mensagens: [],
                isLoading: false
            }

            const { getByTestId } = renderChatBox({ activeChat, filesSelected: mockSelectedFiles })

            const encoder = new TextEncoder()
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('{"response": "test response"}'))
                    controller.close()
                }
            })

            ;(sendMsgToStream as jest.Mock).mockResolvedValue({
                body: stream,
                status: 200
            })

            const input = getByTestId('chat-input')
            fireEvent.change(input, { target: { value: 'Hello, world!' } })

            const accountInfo = {
                idTokenClaims: {
                    siga_roles: ['P400S1', 'P400S3']
                },
                username: 'testuser',
                name: 'Test User'
            }
            msalInstance.getActiveAccount = jest.fn().mockReturnValue(accountInfo)

            await act(async () => {
                fireEvent.click(getByTestId('botao-enviar'))
            })

            expect(mockSetActiveChat).toHaveBeenCalledWith(
                expect.objectContaining({
                    mensagens: expect.arrayContaining([
                        expect.objectContaining({
                            conteudo: 'Hello, world!',
                            temp_chat_id: 'test-uuid'
                        })
                    ])
                })
            )
        })
    })

    //     describe('handleCloseFeedbackDialog', () => {
    //         it('should close the feedback dialog and reset feedback state', () => {
    //             const activeChat: IChat = {
    //                 id: 'chat1',
    //                 mensagens: [
    //                     {
    //                         chat_id: '1',
    //                         codigo: '1',
    //                         conteudo: 'AB',
    //                         feedback: undefined,
    //                         papel: 'USER',
    //                         trechos: [],
    //                         arquivos_selecionados: [],
    //                         arquivos_selecionados_prontos: []
    //                     },
    //                     {
    //                         chat_id: '2',
    //                         codigo: '2',
    //                         conteudo: 'AB',
    //                         feedback: undefined,
    //                         papel: 'ASSISTANT',
    //                         trechos: [],
    //                         arquivos_selecionados: [],
    //                         arquivos_selecionados_prontos: []
    //                     }
    //                 ],
    //                 isLoading: false
    //             }
    //
    //             const queryClient = new QueryClient()
    //
    //             const { getByTestId, getByLabelText } = render(
    //                 <QueryClientProvider client={queryClient}>
    //                     <AlertProvider>
    //                         <ChatBox activeChat={activeChat} />
    //                     </AlertProvider>
    //                 </QueryClientProvider>
    //             )
    //
    //             fireEvent.click(getByLabelText('Gostei'))
    //             fireEvent.click(getByTestId('cancelar-feedback'))
    //
    //             expect(mockSetActiveChat).toHaveBeenCalledWith(
    //                 expect.objectContaining({
    //                     mensagens: expect.arrayContaining([
    //                         expect.objectContaining({
    //                             feedback: undefined
    //                         })
    //                     ])
    //                 })
    //             )
    //         })
    //     })
    //
    //     describe('handleSendFeedback', () => {
    //         it('should submit a new chat message', async () => {
    //             const uuidv = uuidv4 as jest.Mock
    //             uuidv.mockReturnValue('test-uuid')
    //
    //             const activeChat: IChat = {
    //                 id: 'chat1',
    //                 mensagens: [
    //                     {
    //                         chat_id: '1',
    //                         codigo: '1',
    //                         conteudo: 'AB',
    //                         feedback: undefined,
    //                         papel: 'USER',
    //                         trechos: [],
    //                         arquivos_selecionados: [],
    //                         arquivos_selecionados_prontos: []
    //                     },
    //                     {
    //                         chat_id: '2',
    //                         codigo: '2',
    //                         conteudo: 'AB',
    //                         feedback: {
    //                             chat_id: '1',
    //                             cod_mensagem: '123',
    //                             conteudo: 'teste',
    //                             inveridico: true,
    //                             reacao: 'LIKED',
    //                             nao_ajudou: false,
    //                             ofensivo: false
    //                         },
    //                         papel: 'ASSISTANT',
    //                         trechos: [],
    //                         arquivos_selecionados: [],
    //                         arquivos_selecionados_prontos: []
    //                     }
    //                 ],
    //                 isLoading: false
    //             }
    //
    //             const { getByTestId } = renderChatBox({ activeChat, filesSelected: mockSelectedFiles })
    //
    //             const encoder = new TextEncoder()
    //             const stream = new ReadableStream({
    //                 start(controller) {
    //                     controller.enqueue(encoder.encode('{"response": "test response"}'))
    //                     controller.close()
    //                 }
    //             })
    //
    //             ;(sendMsgToStream as jest.Mock).mockResolvedValue({
    //                 body: stream,
    //                 status: 200
    //             })
    //
    //             const input = getByTestId('chat-input')
    //             fireEvent.change(input, { target: { value: 'Hello, world!' } })
    //
    //             const accountInfo = {
    //                 idTokenClaims: {
    //                     siga_roles: ['P400S1', 'P400S3']
    //                 },
    //                 username: 'testuser',
    //                 name: 'Test User'
    //             }
    //             msalInstance.getActiveAccount = jest.fn().mockReturnValue(accountInfo)
    //
    //             await act(async () => {
    //                 fireEvent.click(getByTestId('botao-enviar'))
    //             })
    //
    //             expect(mockSetActiveChat).toHaveBeenCalledWith(
    //                 expect.objectContaining({
    //                     mensagens: expect.arrayContaining([
    //                         expect.objectContaining({
    //                             conteudo: 'Hello, world!',
    //                             temp_chat_id: 'test-uuid'
    //                         })
    //                     ])
    //                 })
    //             )
    //         })
    //     })
})

describe('Share Button', () => {
    const mockProfileWithPermission: IUserInfo = {
        login: '',
        perfilDev: true,
        perfilDevOrPreview: true,
        perfilPreview: true,
        name: '',
        initialLetters: ''
    }

    it('não deve mostrar o botão de compartilhar quando não há chat', () => {
        const { queryByText } = renderChatBox({
            profile: mockProfileWithPermission,
            activeChat: null
        })

        expect(queryByText('Compartilhar')).not.toBeInTheDocument()
    })

    it('não deve mostrar o botão de compartilhar quando o chat está carregando', () => {
        const activeChat: IChat = {
            id: 'chat1',
            mensagens: [
                {
                    chat_id: '1',
                    codigo: '1',
                    conteudo: 'test',
                    papel: 'USER'
                }
            ],
            isLoading: true
        }

        const { queryByText } = renderChatBox({
            profile: mockProfileWithPermission,
            activeChat
        })

        expect(queryByText('Compartilhar')).not.toBeInTheDocument()
    })

    it('não deve mostrar o botão de compartilhar quando o chat está em streaming', () => {
        const activeChat: IChat = {
            id: 'chat1',
            mensagens: [
                {
                    chat_id: '1',
                    codigo: '1',
                    conteudo: 'test',
                    papel: 'USER'
                }
            ],
            isLoading: false,
            isStreamActive: true
        }

        const { queryByText } = renderChatBox({
            profile: mockProfileWithPermission,
            activeChat
        })

        expect(queryByText('Compartilhar')).not.toBeInTheDocument()
    })

    it('não deve mostrar o botão de compartilhar quando o chat está arquivado', () => {
        const activeChat: IChat = {
            id: 'chat1',
            mensagens: [
                {
                    chat_id: '1',
                    codigo: '1',
                    conteudo: 'test',
                    papel: 'USER'
                }
            ],
            isLoading: false,
            arquivado: true
        }

        const { queryByText } = renderChatBox({
            profile: mockProfileWithPermission,
            activeChat
        })

        expect(queryByText('Compartilhar')).not.toBeInTheDocument()
    })

    it('deve mostrar o botão de compartilhar quando o chat tem mensagens e não está carregando/streaming/arquivado', () => {
        const activeChat: IChat = {
            id: 'chat1',
            mensagens: [
                {
                    chat_id: '1',
                    codigo: '1',
                    conteudo: 'test',
                    papel: 'USER'
                }
            ],
            isLoading: false,
            isStreamActive: false,
            arquivado: false
        }

        const { getByText } = renderChatBox({
            profile: mockProfileWithPermission,
            activeChat
        })

        expect(getByText('Compartilhar')).toBeInTheDocument()
    })

    it('deve chamar handleStartShareChat quando o botão de compartilhar for clicado', () => {
        const mockHandleStartShareChat = jest.fn()
        const activeChat: IChat = {
            id: 'chat1',
            mensagens: [
                {
                    chat_id: '1',
                    codigo: '1',
                    conteudo: 'test',
                    papel: 'USER'
                }
            ],
            isLoading: false,
            isStreamActive: false,
            arquivado: false
        }

        const { getByText } = renderChatBox({
            profile: mockProfileWithPermission,
            activeChat,
            handleStartShareChat: mockHandleStartShareChat
        })

        fireEvent.click(getByText('Compartilhar'))
        expect(mockHandleStartShareChat).toHaveBeenCalledWith(activeChat)
    })
})
