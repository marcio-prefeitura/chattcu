import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InputBox, { IInputBoxProps } from '../../../components/chat-box/InputBox'
import { IChat } from '../../../infrastructure/utils/types'
import { IFolder, IFile } from '../../../shared/interfaces/Folder'
import { sendStopChatProcess } from '../../../infrastructure/api'
import { useQueryClient } from '@tanstack/react-query'
import { IUserInfo } from '../../../hooks/useUserInfo'

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/test' })
}))

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: jest.fn(),
    useQuery: jest.fn().mockReturnValue({
        data: {
            modelos: [
                {
                    name: 'GPT-4o',
                    selected: true,
                    icon: 'icon-gpt',
                    description: 'Test model',
                    is_beta: false,
                    max_words: 60000
                }
            ]
        },
        isLoading: false,
        isError: false,
        error: null
    })
}))

jest.mock('../../../infrastructure/api', () => ({
    sendStopChatProcess: jest.fn()
}))

jest.mock('../../../infrastructure/utils/util', () => ({
    isLocalhost: jest.fn().mockReturnValue(false)
}))

const createMockFile = (id: string, nome: string, status = 'PRONTO'): IFile => ({
    id,
    nome,
    tipo_midia: 'text',
    id_pasta_pai: '10',
    usuario: 'Test User',
    st_removido: false,
    data_criacao: new Date().toISOString(),
    st_arquivo: true,
    tamanho: 1024,
    nome_blob: `blob${id}`,
    status,
    selected: false,
    progress: 0,
    show: true,
    uploaded: true
})

const createMockFolder = (id: string): IFolder => ({
    id,
    nome: 'Test Folder',
    usuario: 'Test User',
    st_removido: false,
    id_pasta_pai: '0',
    data_criacao: new Date().toISOString(),
    st_arquivo: false,
    open: false,
    selected: false,
    arquivos: [createMockFile('1', 'test.pdf')],
    show: true,
    tamanho: 0,
    tipo_midia: 'folder',
    nome_blob: `blob-folder-${id}`,
    status: 'active'
})

const mockChat: IChat = {
    id: '1',
    mensagens: [],
    isLoading: false,
    isStreamActive: false,
    correlacaoChamadaId: '123',
    titulo: 'Test Chat'
}

describe('InputBox Component', () => {
    const mockTextareaRef = {
        current: document.createElement('textarea')
    } as React.RefObject<HTMLTextAreaElement>

    const defaultProps: IInputBoxProps = {
        filesSelected: [],
        setFilesSelected: jest.fn(),
        chat: mockChat,
        setChat: jest.fn(),
        activeChat: mockChat,
        chatHandler: {
            set: jest.fn(),
            getTokens: jest.fn().mockReturnValue(0),
            isStreaming: jest.fn().mockReturnValue(false)
        },
        textareaRef: mockTextareaRef,
        foldersRef: { current: [createMockFolder('1')] },
        submitChatMessage: jest.fn(),
        setTitleAlertModal: jest.fn(),
        setMessageAlertModal: jest.fn(),
        setOpenAlertModal: jest.fn(),
        setUpdatedFoldersFromChipsActions: jest.fn(),
        profile: {
            name: 'Test User',
            email: 'test@example.com',
            login: 'testuser',
            initialLetters: 'TU',
            perfilDev: true,
            perfilPreview: false,
            perfilDevOrPreview: true
        } as IUserInfo,
        abortStream: jest.fn(),
        selectedAgent: undefined,
        setSelectedAgent: jest.fn(),
        isSharedChat: false,
        isModelLocked: false,
        setIsModelLocked: jest.fn(),
        isChatLoading: false,
        getSelectedModelFromActiveChat: () => undefined,
        handleClikShowSidebar: jest.fn()
    }

    beforeAll(() => {
        document.getElementById = jest.fn()
    })

    beforeEach(() => {
        jest.clearAllMocks()
        const mockQueryClient = {
            getQueryData: jest.fn().mockReturnValue([
                {
                    labelAgente: 'Agente Test',
                    valueAgente: 'TEST',
                    selected: true,
                    quebraGelo: [],
                    autor: 'Test',
                    descricao: 'Test Agent',
                    icon: 'test-icon'
                }
            ]),
            setQueryData: jest.fn()
        }
        ;(useQueryClient as jest.Mock).mockReturnValue(mockQueryClient)
    })

    const renderComponent = (props = {}) => {
        return render(
            <MemoryRouter>
                <InputBox
                    {...defaultProps}
                    {...props}
                />
            </MemoryRouter>
        )
    }

    it('deve renderizar corretamente.', () => {
        renderComponent()
        expect(screen.getByTestId('chat-input')).toBeInTheDocument()
        expect(screen.getByTestId('botao-enviar')).toBeInTheDocument()
    })

    // TODO AJUSTAR TESTE
    // it('deve enviar mensagem ao pressionar Enter', () => {
    //     const { chatHandler } = defaultProps
    //     chatHandler.isStreaming.mockReturnValue(false)
    //     chatHandler.getTokens.mockReturnValue(5)
    //
    //     const { container } = renderComponent()
    //
    //     const input = screen.getByTestId('chat-input')
    //     fireEvent.change(input, { target: { value: 'test message' } })
    //
    //     fireEvent.keyDown(input, {
    //         key: 'Enter',
    //         code: 'Enter',
    //         keyCode: 13,
    //         charCode: 13
    //     })
    //
    //     expect(defaultProps.submitChatMessage).toHaveBeenCalled()
    // })
    it('não deve enviar mensagem se Enter + Shift for pressionado', () => {
        renderComponent()
        const input = screen.getByTestId('chat-input')
        fireEvent.change(input, { target: { value: 'test message' } })
        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
        expect(defaultProps.submitChatMessage).not.toHaveBeenCalled()
    })

    it('deve mostrar botão de stop quando chat está carregando', () => {
        const chatWithLoading = {
            ...mockChat,
            isLoading: true,
            isStreamActive: true
        }

        renderComponent({ chat: chatWithLoading, activeChat: chatWithLoading })
        expect(screen.getByTestId('botao-stop')).toBeInTheDocument()
    })

    it('deve parar o processo do chat ao clicar no botão stop', async () => {
        const chatWithLoading = {
            ...mockChat,
            isLoading: true,
            isStreamActive: true
        }

        ;(sendStopChatProcess as jest.Mock).mockResolvedValue({ status: 200 })

        renderComponent({
            chat: chatWithLoading,
            activeChat: { ...chatWithLoading, correlacaoChamadaId: '123' }
        })

        const stopButton = screen.getByTestId('botao-stop')
        fireEvent.click(stopButton)

        await waitFor(() => {
            expect(sendStopChatProcess).toHaveBeenCalledWith('123')
            expect(defaultProps.abortStream).toHaveBeenCalled()
        })
    })

    it('deve lidar com a menção de agentes (@)', () => {
        renderComponent()
        const input = screen.getByTestId('chat-input')
        fireEvent.change(input, { target: { value: 'test @agent' } })
        expect((input as HTMLInputElement).value).toBe('test @agent')
    })

    it('deve limpar a entrada quando o chat é inválido', () => {
        const { rerender } = renderComponent()
        rerender(
            <MemoryRouter>
                <InputBox
                    {...defaultProps}
                    activeChat={null}
                />
            </MemoryRouter>
        )
        expect(defaultProps.setFilesSelected).toHaveBeenCalledWith([])
    })

    it('deve filtrar agentes corretamente', () => {
        renderComponent()
        const input = screen.getByTestId('chat-input') as HTMLInputElement

        fireEvent.change(input, { target: { value: 'test @Agent' } })

        const agentButton = screen.getByRole('button', { name: /Agente Test/i })
        expect(agentButton).toBeInTheDocument()
    })

    it('deve gerenciar o localStorage corretamente', () => {
        const mockStorage = {
            chat_id: '1',
            conteudo: 'mensagem salva'
        }

        Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockStorage))
        renderComponent()

        if (mockTextareaRef.current) {
            expect(mockTextareaRef.current.value).toBe('mensagem salva')
        }
    })

    it('deve atualizar o contador de palavras corretamente', () => {
        const mockGetTokens = jest.fn().mockReturnValue(2)
        const props = {
            ...defaultProps,
            chatHandler: {
                ...defaultProps.chatHandler,
                getTokens: mockGetTokens
            }
        }

        renderComponent(props)
        const input = screen.getByTestId('chat-input')
        fireEvent.change(input, { target: { value: 'Hello world' } })

        expect(mockGetTokens).toHaveBeenCalled()
    })

    it('deve desabilitar o botão de envio quando exceder o limite de palavras', () => {
        const mockGetTokens = jest.fn().mockReturnValue(61000)
        const props = {
            ...defaultProps,
            chatHandler: {
                ...defaultProps.chatHandler,
                getTokens: mockGetTokens
            }
        }

        renderComponent(props)
        const input = screen.getByTestId('chat-input')
        const sendButton = screen.getByTestId('botao-enviar')

        fireEvent.change(input, { target: { value: 'a '.repeat(61000) } })

        expect(sendButton).toHaveAttribute('disabled')
    })

    it('deve abrir a aba de arquivos ao clicar no ícone de upload', () => {
        renderComponent()
        const uploadIcon = screen.getByTestId('icon-upload')

        fireEvent.click(uploadIcon)

        expect(defaultProps.handleClikShowSidebar).toHaveBeenCalled()
    })

    it('deve verificar arquivos prontos corretamente com arquivos mistos', () => {
        renderComponent({
            filesSelected: [
                {
                    folder_name: 'Test Folder',
                    selected_files: [
                        createMockFile('1', 'test1.pdf', 'PRONTO'),
                        createMockFile('2', 'test2.pdf', 'PROCESSANDO'),
                        createMockFile('3', 'test3.pdf', 'PRONTO')
                    ]
                }
            ],
            chatHandler: {
                ...defaultProps.chatHandler,
                isStreaming: jest.fn().mockReturnValue(false),
                getTokens: jest.fn().mockReturnValue(5)
            }
        })

        const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
        fireEvent.change(input, { target: { value: 'test message' } })

        const sendButton = screen.getByTestId('botao-enviar')
        fireEvent.click(sendButton)

        expect(defaultProps.setTitleAlertModal).toHaveBeenCalledWith('Aviso')
    })

    it('deve lidar com arquivos não encontrados em nenhuma pasta', () => {
        const mockFoldersRef = {
            current: [
                {
                    ...createMockFolder('1'),
                    arquivos: [] // Pasta vazia
                }
            ]
        }

        const chatWithFiles = {
            ...mockChat,
            mensagens: [
                {
                    arquivos_selecionados_prontos: ['non-existent-file']
                }
            ]
        }

        const mockSetFilesSelected = jest.fn()

        renderComponent({
            activeChat: chatWithFiles,
            foldersRef: mockFoldersRef,
            setFilesSelected: mockSetFilesSelected
        })

        expect(mockSetFilesSelected).toHaveBeenCalledWith([])
    })

    it('deve lidar com ausência de correlacaoChamadaId', async () => {
        const chatWithLoading = {
            ...mockChat,
            isLoading: true,
            isStreamActive: true,
            correlacaoChamadaId: undefined
        }

        renderComponent({
            chat: chatWithLoading,
            activeChat: chatWithLoading
        })

        const stopButton = screen.getByTestId('botao-stop')
        expect(stopButton).toHaveAttribute('disabled')
    })

    describe('verificaArquivosSelecionadosProntos', () => {
        it('deve retornar true quando não há arquivos selecionados', () => {
            const { container } = renderComponent({
                filesSelected: [],
                chatHandler: {
                    ...defaultProps.chatHandler,
                    isStreaming: jest.fn().mockReturnValue(false)
                },
                textareaRef: {
                    current: { value: 'test message' }
                } as any
            })

            const input = screen.getByTestId('chat-input')
            fireEvent.change(input, { target: { value: 'test message' } })

            const sendButton = screen.getByTestId('botao-enviar')
            fireEvent.click(sendButton)

            expect(defaultProps.submitChatMessage).toHaveBeenCalled()
        })

        it('deve retornar true quando todos os arquivos estão prontos', () => {
            renderComponent({
                filesSelected: [
                    {
                        folder_name: 'Test Folder',
                        selected_files: [
                            createMockFile('1', 'test1.pdf', 'PRONTO'),
                            createMockFile('2', 'test2.pdf', 'PRONTO')
                        ]
                    }
                ]
            })

            const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
            fireEvent.change(input, { target: { value: 'test message' } })

            const sendButton = screen.getByTestId('botao-enviar')
            fireEvent.click(sendButton)

            expect(defaultProps.submitChatMessage).toHaveBeenCalled()
        })
    })

    describe('handleChangePrompt', () => {
        it('deve remover @ quando chat está carregando', () => {
            const chatWithLoading = {
                ...mockChat,
                isLoading: true,
                isStreamActive: true
            }

            renderComponent({
                chat: chatWithLoading,
                chatHandler: {
                    ...defaultProps.chatHandler,
                    getTokens: jest.fn().mockReturnValue(5)
                }
            })

            const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
            fireEvent.change(input, { target: { value: 'test @' } })

            expect(input.value).not.toContain('@')
        })

        it('deve atualizar o mentionText quando @ é digitado', () => {
            renderComponent()
            const input = screen.getByTestId('chat-input') as HTMLTextAreaElement

            fireEvent.change(input, { target: { value: 'test @Agent' } })

            const agentsList = screen.getByText('Agente Test')
            expect(agentsList).toBeInTheDocument()
        })
    })

    describe('getFilesMessage', () => {
        it('deve lidar com arquivos não encontrados', () => {
            const chatWithInvalidFile = {
                ...mockChat,
                mensagens: [
                    {
                        arquivos_selecionados_prontos: ['non-existent-file']
                    }
                ]
            }

            renderComponent({ activeChat: chatWithInvalidFile })
            expect(defaultProps.setFilesSelected).toHaveBeenCalledWith([])
        })
    })

    describe('handleModelChange', () => {
        it('deve atualizar maxWords quando um novo modelo é selecionado', async () => {
            const mockQueryClient = {
                getQueryData: jest.fn().mockImplementation(queryKey => {
                    if (queryKey[0] === 'agents') {
                        return [
                            {
                                labelAgente: 'Agente Test',
                                valueAgente: 'TEST',
                                selected: true,
                                quebraGelo: [],
                                autor: 'Test',
                                descricao: 'Test Agent',
                                icon: 'test-icon'
                            }
                        ]
                    }
                    return [
                        {
                            name: 'GPT-4o',
                            selected: true,
                            icon: 'icon-gpt',
                            description: 'Test model',
                            is_beta: false,
                            max_words: 60000
                        },
                        {
                            name: 'Claude 3.5 Sonnet',
                            selected: false,
                            icon: 'icon-claude',
                            description: 'Test model',
                            is_beta: false,
                            max_words: 95000
                        }
                    ]
                }),
                setQueryData: jest.fn()
            }

            ;(useQueryClient as jest.Mock).mockReturnValue(mockQueryClient)

            const mockGetTokens = jest.fn().mockReturnValue(96000)
            const mockChatHandler = {
                ...defaultProps.chatHandler,
                getTokens: mockGetTokens,
                isStreaming: jest.fn().mockReturnValue(false)
            }

            renderComponent({
                chatHandler: mockChatHandler,
                getSelectedModelFromActiveChat: () => 'GPT-4o'
            })

            const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
            fireEvent.change(input, { target: { value: 'a'.repeat(96000) } })

            const sendButton = screen.getByTestId('botao-enviar')

            await waitFor(() => {
                expect(sendButton).toHaveAttribute('disabled')
            })
        })
    })

    describe('handleStopChatProcess', () => {
        it('deve abortar stream quando é localhost', async () => {
            const isLocalhost = jest.requireMock('../../../infrastructure/utils/util').isLocalhost
            isLocalhost.mockReturnValueOnce(true)

            const chatWithLoading = {
                ...mockChat,
                isLoading: true,
                isStreamActive: true
            }

            renderComponent({
                chat: chatWithLoading,
                activeChat: chatWithLoading
            })

            const stopButton = screen.getByTestId('botao-stop')
            fireEvent.click(stopButton)

            expect(defaultProps.abortStream).toHaveBeenCalled()
            expect(sendStopChatProcess).not.toHaveBeenCalled()
        })

        it('não deve abortar stream quando resposta não é 200', async () => {
            // eslint-disable-next-line @typescript-eslint/no-extra-semi
            ;(sendStopChatProcess as jest.Mock).mockResolvedValue({ status: 400 })

            const chatWithLoading = {
                ...mockChat,
                isLoading: true,
                isStreamActive: true
            }

            renderComponent({
                chat: chatWithLoading,
                activeChat: chatWithLoading
            })

            const stopButton = screen.getByTestId('botao-stop')
            fireEvent.click(stopButton)

            await waitFor(() => {
                expect(defaultProps.abortStream).not.toHaveBeenCalled()
            })
        })
    })
})
