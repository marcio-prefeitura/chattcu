import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { IChat, IMessageHistory } from '../../../infrastructure/utils/types'
import { IUserInfo } from '../../../hooks/useUserInfo'
import Message, { getIgnoredFiles } from '../../../components/chat-box/message/Message'
import { AlertProvider } from '../../../context/AlertContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockNavigate = jest.fn()
const mockUseLocation = jest.fn()

jest.mock('../../../infrastructure/api', () => ({
    listFilesByIds: jest.fn().mockResolvedValue([{ id: '3', nome: 'arquivo3.txt' }]),
    enviarFeedback: jest.fn().mockResolvedValue({ status: 200 })
}))

const renderWithProvider = (ui: React.ReactElement) => {
    return render(<AlertProvider>{ui}</AlertProvider>)
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false
        }
    }
})

const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <AlertProvider>{ui}</AlertProvider>
        </QueryClientProvider>
    )
}

const mockScrollArea = {
    current: {
        scrollTo: jest.fn(),
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 500
    }
} as unknown as React.RefObject<HTMLDivElement>

const mockProfile: IUserInfo = {
    login: '',
    perfilDev: false,
    perfilDevOrPreview: false,
    perfilPreview: false,
    name: '',
    initialLetters: ''
}

const mockActiveChat: IChat = {
    id: '1',
    mensagens: [],
    isLoading: false
}

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

jest.mock('uuid')

describe('<Message />', () => {
    beforeEach(() => {
        queryClient.clear()
    })
    test('Renderização Básica', () => {
        const messageMock: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Teste',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { queryByText } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={messageMock}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )
        expect(queryByText('Teste')).toBeInTheDocument()
    })

    test('Renderização de Perfil de Usuário', () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'AB',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }
        const { getByText } = render(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )
        expect(getByText('AB')).toBeInTheDocument()
    })

    test('Should render assistant message correctly', () => {
        const assistantMessage: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Assistant Response',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'test',
                inveridico: false,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { getByText, container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={assistantMessage}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        expect(getByText('Assistant Response')).toBeInTheDocument()
        expect(container.querySelector('.message__box-paragrafo')).toBeInTheDocument()
    })

    test('Retorna false quando arquivos_selecionados está vazio', () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'AB',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const result = getIgnoredFiles(message)
        expect(result).toBe(false)
    })

    test('Retorna false quando todos os arquivos selecionados estão prontos', () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'AB',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: ['1', '2', '3'],
            arquivos_selecionados_prontos: ['1', '2', '3']
        }

        const result = getIgnoredFiles(message)
        expect(result).toBe(false)
    })

    test('Retorna uma lista dos arquivos não prontos quando alguns arquivos selecionados não estão prontos', () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'AB',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: ['1', '2', '3'],
            arquivos_selecionados_prontos: ['1', '3']
        }

        const result = getIgnoredFiles(message)
        expect(result).toEqual(['2'])
    })

    test('Renderização de Conteúdo com Citação', () => {
        const messageWithCitation: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Este é um texto com uma citação.\n[cit-button-msg-456-1]',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'Este é um texto com uma citação.\n[cit-button-msg-456-1]',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { getByText } = render(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={messageWithCitation}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        expect(getByText('Este é um texto com uma citação.', { exact: false })).toBeInTheDocument()
    })

    test('Renderização de Conteúdo com Código', async () => {
        const messageHighlighter: IMessageHistory = {
            chat_id: '1',
            codigo: '1123',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'const x = 10;console.log(x);',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: [],
            conteudo: 'const x = 10;console.log(x);'
        }

        const { getByText } = render(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={messageHighlighter}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        expect(getByText('const x = 10;console.log(x);')).toBeInTheDocument()
    })

    test('Should handle feedback dialog interactions', async () => {
        const setActiveChat = jest.fn()
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={setActiveChat}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]') // Mudado de "Like" para "Gostei"
        expect(likeButton).toBeInTheDocument()
        if (likeButton) {
            fireEvent.click(likeButton)
        }

        await waitFor(() => {
            expect(container.querySelector('.message__feedback')).toBeInTheDocument()
        })
    })

    test('Should render correctly in shared chat mode', () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Shared chat message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { container, getByText } = render(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={true}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        expect(getByText('Shared chat message')).toBeInTheDocument()
        expect(container.querySelector('.message__box-avatar-user-question Avatar')).not.toBeInTheDocument()
    })

    test('Should show success and error toasts', async () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const mockSetActiveChat = jest.fn(updater => {
            if (typeof updater === 'function') {
                updater({ ...mockActiveChat })
            }
        })

        const { container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={mockSetActiveChat}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        if (likeButton) {
            fireEvent.click(likeButton)
        }

        await waitFor(() => {
            expect(container.querySelector('.message__feedback')).toBeInTheDocument()
        })

        const submitButton = container.querySelector('button[type="submit"]')
        if (submitButton) {
            fireEvent.click(submitButton)
        }
    })

    test('Renderização de Conteúdo com Tabela', () => {
        const messageWithTable: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: '| Cabeçalho 1 | Cabeçalho 2 |',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: [],
            conteudo: '| Cabeçalho 1 | Cabeçalho 2 |'
        }
        const { getByText } = render(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={messageWithTable}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )
        expect(getByText('| Cabeçalho 1 | Cabeçalho 2 |')).toBeInTheDocument()
    })

    test('Renderização de Conteúdo com Link Markdown', () => {
        const messageWithLink: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: [],
            conteudo: 'Este é um link'
        }
        const { getByText } = render(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={messageWithLink}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )
        expect(getByText('Este é um link')).toBeInTheDocument()
    })

    test('Renderização de Conteúdo com Quebra de Linha', () => {
        const messageWithBreaks: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'Primeira linha\nSegunda linha',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: [],
            conteudo: 'Primeira linha\nSegunda linha'
        }

        render(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={messageWithBreaks}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        expect(
            screen.getByText('Primeira linha', { selector: '.message__user-question', exact: false })
        ).toBeInTheDocument()
        expect(
            screen.getByText('Segunda linha', { selector: '.message__user-question', exact: false })
        ).toBeInTheDocument()
    })

    test('Should update active chat when feedback is sent', () => {
        const setActiveChat = jest.fn()
        const testMessage: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const testActiveChat: IChat = {
            id: '1',
            mensagens: [testMessage],
            isLoading: false
        }

        const { container } = renderWithProviders(
            <Message
                activeChat={testActiveChat}
                setActiveChat={setActiveChat}
                isSharedChat={false}
                profile={mockProfile}
                message={testMessage}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        if (likeButton) {
            fireEvent.click(likeButton)

            const feedback = {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            }

            setActiveChat(prev => {
                if (prev) {
                    prev.mensagens = prev.mensagens.map(msg => {
                        if (msg.codigo === feedback.cod_mensagem) {
                            return { ...msg, feedback }
                        }
                        return msg
                    })
                }
                return prev
            })
        }

        expect(setActiveChat).toHaveBeenCalled()
    })

    test('Should detect when scroll is near bottom', async () => {
        const mockScrollAreaNearBottom = {
            current: {
                scrollTo: jest.fn(),
                scrollTop: 800,
                scrollHeight: 1000,
                clientHeight: 150
            }
        } as unknown as React.RefObject<HTMLDivElement>

        expect(mockScrollAreaNearBottom.current).not.toBeNull()

        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollAreaNearBottom}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        if (likeButton && mockScrollAreaNearBottom.current) {
            fireEvent.click(likeButton)

            await waitFor(() => {
                if (mockScrollAreaNearBottom.current) {
                    expect(mockScrollAreaNearBottom.current.scrollTo).toHaveBeenCalledWith({
                        top: expect.any(Number),
                        behavior: 'smooth'
                    })
                }
            })
        }
    })

    test('Should handle closing feedback dialog', async () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        if (likeButton) {
            fireEvent.click(likeButton)
        }

        await waitFor(() => {
            expect(container.querySelector('.message__feedback')).toBeInTheDocument()
        })

        const cancelButton = container.querySelector('[data-testid="cancelar-feedback"]')
        if (cancelButton) {
            fireEvent.click(cancelButton)

            jest.advanceTimersByTime(300)
        }

        await waitFor(() => {
            expect(container.querySelector('.message__feedback')).not.toBeInTheDocument()
        })
    })

    test('Should handle openModalTooltip for non-archive content', () => {
        const trecho = ['trecho de teste']
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test content',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: trecho,
            arquivos_busca: 'Não Arquivos',
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const setActiveChat = jest.fn()
        const { container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={setActiveChat}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const content = container.querySelector('.message__box-paragrafo-chattcu')
        if (content) {
            fireEvent.click(content)
            expect(container.querySelector('.message__icones-texto')).toBeInTheDocument()
        }
    })

    test('Should handle feedback sending with different chat IDs', () => {
        const differentChatId = '2'
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: differentChatId,
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const setActiveChat = jest.fn()
        const { container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={setActiveChat}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        if (likeButton) {
            fireEvent.click(likeButton)
            expect(setActiveChat).not.toHaveBeenCalled()
        }
    })

    test('Should handle scroll position when not near bottom', async () => {
        const mockScrollAreaNotBottom = {
            current: {
                scrollTo: jest.fn(),
                scrollTop: 100,
                scrollHeight: 1000,
                clientHeight: 200
            }
        } as unknown as React.RefObject<HTMLDivElement>

        expect(mockScrollAreaNotBottom.current).not.toBeNull()

        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { container } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollAreaNotBottom}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        if (likeButton && mockScrollAreaNotBottom.current) {
            fireEvent.click(likeButton)

            await waitFor(() => {
                if (mockScrollAreaNotBottom.current) {
                    expect(mockScrollAreaNotBottom.current.scrollTo).toHaveBeenCalledWith({
                        top: expect.any(Number),
                        behavior: 'smooth'
                    })
                }
            })
        }
    })

    test('Should update message state after feedback', async () => {
        const originalMessage: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: '',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const mockChat: IChat = {
            id: '1',
            mensagens: [originalMessage],
            isLoading: false
        }

        const setActiveChat = jest.fn(updater => {
            if (typeof updater === 'function') {
                const newState = updater(mockChat)
                return newState
            }
            return mockChat
        })

        const { container } = renderWithProviders(
            <Message
                activeChat={mockChat}
                setActiveChat={setActiveChat}
                isSharedChat={false}
                profile={mockProfile}
                message={originalMessage}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        expect(likeButton).toBeInTheDocument()

        if (likeButton) {
            fireEvent.click(likeButton)
        }

        await waitFor(() => {
            const feedbackDialog = container.querySelector('.message__feedback')
            expect(feedbackDialog).toBeInTheDocument()
        })

        const textarea = container.querySelector('textarea')
        if (textarea) {
            fireEvent.change(textarea, { target: { value: 'Test feedback comment' } })
        }

        const confirmButton = container.querySelector('[data-testid="modal-save-action"]')
        expect(confirmButton).not.toBeDisabled()

        if (confirmButton) {
            fireEvent.click(confirmButton)

            const feedback = {
                chat_id: mockChat.id,
                cod_mensagem: originalMessage.codigo,
                conteudo: 'Test feedback comment',
                inveridico: false,
                reacao: 'LIKED' as const,
                nao_ajudou: false,
                ofensivo: false
            }

            const mensagensUpdated = mockChat.mensagens.map(msg => {
                if (msg.codigo === feedback.cod_mensagem) {
                    return { ...msg, feedback }
                }
                return msg
            })

            setActiveChat(prev => {
                if (prev) {
                    return {
                        ...prev,
                        mensagens: mensagensUpdated
                    }
                }
                return prev
            })

            await waitFor(() => {
                expect(setActiveChat).toHaveBeenCalled()
            })
        }
    })

    test('Should handle both types of tooltip modals', async () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'AB',
            feedback: {
                chat_id: '1',
                cod_mensagem: '123',
                conteudo: 'teste',
                inveridico: true,
                reacao: 'LIKED',
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'USER',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const { container, rerender } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const citationButton = container.querySelector('[data-testid="cit-button-msg"]')
        if (citationButton) {
            fireEvent.click(citationButton)
            await waitFor(() => {
                expect(container.querySelector('.MuiDialog-root')).toBeInTheDocument()
            })
        }

        const messageWithoutArchive = {
            ...message,
            arquivos_busca: 'Não Arquivos'
        }

        rerender(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={messageWithoutArchive}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const citationButtonRerendered = container.querySelector('[data-testid="cit-button-msg"]')
        if (citationButtonRerendered) {
            fireEvent.click(citationButtonRerendered)
            await waitFor(() => {
                expect(container.querySelector('.MuiDialog-root')).toBeInTheDocument()
            })
        }
    })

    test('Should render assistant avatar and robo icon', () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const mockChat: IChat = {
            id: '1',
            mensagens: [message],
            isLoading: false
        }

        const { container } = renderWithProviders(
            <Message
                activeChat={mockChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const messageBox = container.querySelector('.message__box-paragrafo')
        expect(messageBox).toBeInTheDocument()

        const assistantAvatar = messageBox?.querySelector('.message__avatar-chattcu')
        expect(assistantAvatar).toBeInTheDocument()

        const baseBox = container.querySelector('.message__box-base-paragrafo')
        expect(baseBox).toBeInTheDocument()

        const assistantMessage = container.querySelector('.message__box-paragrafo-chattcu')
        expect(assistantMessage).toBeInTheDocument()

        expect(container.textContent).toContain('Test message')
    })

    test('Should handle tooltip modals with both types of content and trecho', async () => {
        const testMessage: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: '[cit-button-msg-456-1] Test content',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: ['trecho de teste'],
            arquivos_busca: 'Arquivos',
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const mockChat: IChat = {
            id: '1',
            mensagens: [testMessage],
            isLoading: false
        }

        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false
                }
            }
        })

        const { container, rerender } = render(
            <QueryClientProvider client={queryClient}>
                <AlertProvider>
                    <Message
                        activeChat={mockChat}
                        setActiveChat={jest.fn()}
                        isSharedChat={false}
                        profile={mockProfile}
                        message={testMessage}
                        stopTyping={jest.fn()}
                        shouldScrollToBottom={jest.fn()}
                        scrollArea={mockScrollArea}
                    />
                </AlertProvider>
            </QueryClientProvider>
        )

        const messageText = container.querySelector('.message__box-paragrafo-chattcu')
        expect(messageText).toBeInTheDocument()

        if (messageText) {
            const citationButton = messageText.querySelector('[data-testid="cit-button-msg"]')
            if (citationButton) {
                fireEvent.click(citationButton)

                await waitFor(() => {
                    const tooltipModal = container.querySelector('.MuiDialog-root')
                    expect(tooltipModal).toBeInTheDocument()
                })
            }
        }

        const nonArchiveMessage: IMessageHistory = {
            ...testMessage,
            arquivos_busca: 'Não Arquivos'
        }

        rerender(
            <QueryClientProvider client={queryClient}>
                <AlertProvider>
                    <Message
                        activeChat={mockChat}
                        setActiveChat={jest.fn()}
                        isSharedChat={false}
                        profile={mockProfile}
                        message={nonArchiveMessage}
                        stopTyping={jest.fn()}
                        shouldScrollToBottom={jest.fn()}
                        scrollArea={mockScrollArea}
                    />
                </AlertProvider>
            </QueryClientProvider>
        )

        const updatedMessageText = container.querySelector('.message__box-paragrafo-chattcu')
        expect(updatedMessageText).toBeInTheDocument()

        if (updatedMessageText) {
            const updatedCitationButton = updatedMessageText.querySelector('[data-testid="cit-button-msg"]')
            if (updatedCitationButton) {
                fireEvent.click(updatedCitationButton)

                await waitFor(() => {
                    const tooltipModal = container.querySelector('.MuiDialog-root')
                    expect(tooltipModal).toBeInTheDocument()
                })
            }
        }

        queryClient.clear()
    })

    test('Should render assistant message with all components', () => {
        const message: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test assistant message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: ['1'],
            arquivos_selecionados_prontos: [],
            parametro_modelo_llm: 'GPT-4',
            arquivos_busca: 'file1.txt,file2.txt'
        }

        const { container, getByText } = renderWithProviders(
            <Message
                activeChat={mockActiveChat}
                setActiveChat={jest.fn()}
                isSharedChat={false}
                profile={mockProfile}
                message={message}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        const messageBox = container.querySelector('.message__box-paragrafo')
        expect(messageBox).toBeInTheDocument()

        const avatar = container.querySelector('.message__avatar-chattcu')
        expect(avatar).toBeInTheDocument()

        expect(getByText('Test assistant message')).toBeInTheDocument()

        const actionsBox = container.querySelector('.message__icones-texto')
        expect(actionsBox).toBeInTheDocument()
    })

    test('Should handle complete interaction flow', async () => {
        const testMessage: IMessageHistory = {
            chat_id: '1',
            codigo: '1',
            conteudo: 'Test message',
            feedback: {
                chat_id: '1',
                cod_mensagem: '1',
                conteudo: 'test',
                inveridico: false,
                reacao: undefined,
                nao_ajudou: false,
                ofensivo: false
            },
            papel: 'ASSISTANT',
            trechos: [],
            arquivos_selecionados: [],
            arquivos_selecionados_prontos: []
        }

        const mockChat: IChat = {
            id: '1',
            mensagens: [testMessage],
            isLoading: false
        }

        const setActiveChat = jest.fn()

        const { container } = renderWithProviders(
            <Message
                activeChat={mockChat}
                setActiveChat={setActiveChat}
                isSharedChat={false}
                profile={mockProfile}
                message={testMessage}
                stopTyping={jest.fn()}
                shouldScrollToBottom={jest.fn()}
                scrollArea={mockScrollArea}
            />
        )

        expect(container.querySelector('.message__box-paragrafo')).toBeInTheDocument()

        const likeButton = container.querySelector('[aria-label="Gostei"]')
        expect(likeButton).toBeInTheDocument()

        if (likeButton) {
            fireEvent.click(likeButton)

            await waitFor(() => {
                const feedbackElement = container.querySelector('.message__feedback')
                expect(feedbackElement).toBeInTheDocument()
            })

            const textarea = container.querySelector('.MuiInputBase-input')
            if (textarea) {
                fireEvent.change(textarea, { target: { value: 'Test feedback' } })
            }

            const cancelButton = container.querySelector('[data-testid="cancelar-feedback"]')
            if (cancelButton) {
                fireEvent.click(cancelButton)

                await waitFor(() => {
                    const feedbackElement = container.querySelector('.message__feedback')
                    expect(feedbackElement).not.toBeInTheDocument()
                })
            }
        }
    })
})
