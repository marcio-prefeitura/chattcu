/* eslint-disable @typescript-eslint/no-extra-semi */
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import ShareChatModal from '../../../components/share-chat-modal/ShareChatModal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { shareChat, SharedSent, updateShared } from '../../../infrastructure/api'

jest.mock('../../../infrastructure/api', () => ({
    shareChat: jest.fn()
}))
jest.mock('../../../infrastructure/api', () => ({
    shareChat: jest.fn(),
    SharedSent: jest.fn().mockResolvedValue([]),
    updateShared: jest.fn()
}))

Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn()
    }
})

const mockChat = {
    id: '1',
    titulo: 'Chat de Teste',
    mensagens: [],
    isLoading: false
}

const mockHandleAlert = jest.fn()
const mockOnClose = jest.fn()

const renderWithQueryClient = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false
            }
        }
    })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('<ShareChatModal />', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        ;(SharedSent as jest.Mock).mockResolvedValue([])
    })

    it('renderiza corretamente com o título do chat', () => {
        const { getByText } = renderWithQueryClient(
            <ShareChatModal
                chat={mockChat}
                open={true}
                onClose={mockOnClose}
                handleAlert={mockHandleAlert}
                profile={{} as any}
            />
        )
        expect(getByText('Compartilhar chat "Chat de Teste"')).toBeInTheDocument()
    })

    it('gera um link e muda o estado do botão', async () => {
        ;(shareChat as jest.Mock).mockResolvedValue('http://localhost:3030/share/mock-share-id')

        const { getByText, queryByText } = renderWithQueryClient(
            <ShareChatModal
                chat={mockChat}
                open={true}
                onClose={mockOnClose}
                handleAlert={mockHandleAlert}
                profile={{} as any}
            />
        )

        // Verifica o estado inicial
        expect(getByText('Gerar Link')).toBeInTheDocument()

        // Clica no botão
        fireEvent.click(getByText('Gerar Link'))

        // Espera o botão mudar para "Copiar"
        await waitFor(() => expect(getByText('Copiar')).toBeInTheDocument(), { timeout: 3000 })

        // Verifica se o link foi gerado
        await waitFor(
            () => {
                const linkElement = queryByText((content, element) => {
                    return (
                        (element?.classList.contains('share-chat-modal__texto__nenhum-arquivo') &&
                            element?.textContent?.includes('http://localhost:3030/share/mock-share-id')) ??
                        false
                    )
                })
                expect(linkElement).toBeInTheDocument()
            },
            { timeout: 3000 }
        )

        // Verifica se o alerta foi chamado
        expect(mockHandleAlert).toHaveBeenCalledWith('success', 'Link gerado e copiado')
    })

    it('exibe uma mensagem de erro quando falha ao gerar o link', async () => {
        ;(shareChat as jest.Mock).mockRejectedValue(new Error('Erro ao compartilhar'))

        const { getByText } = renderWithQueryClient(
            <ShareChatModal
                chat={mockChat}
                open={true}
                onClose={mockOnClose}
                handleAlert={mockHandleAlert}
                profile={{} as any}
            />
        )

        fireEvent.click(getByText('Gerar Link'))

        await waitFor(() => {
            expect(mockHandleAlert).toHaveBeenCalledWith('error', 'Erro ao compartilhar: Erro ao compartilhar')
        })
    })

    it('fecha o modal quando o botão de fechar é clicado', () => {
        const { getByLabelText } = renderWithQueryClient(
            <ShareChatModal
                chat={mockChat}
                open={true}
                onClose={mockOnClose}
                handleAlert={mockHandleAlert}
                profile={{} as any}
            />
        )

        fireEvent.click(getByLabelText(''))

        expect(mockOnClose).toHaveBeenCalled()
    })

    it('não renderiza nada quando chat é null', () => {
        const { container } = renderWithQueryClient(
            <ShareChatModal
                chat={null}
                open={true}
                onClose={mockOnClose}
                handleAlert={mockHandleAlert}
                profile={{} as any}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('mostra "Atualizar Link" quando já existe compartilhamento', async () => {
        const mockShare = {
            id: 'existing-share-id',
            chat: { id: '1' }
        }
        ;(SharedSent as jest.Mock).mockResolvedValue([mockShare])

        const { getByText } = renderWithQueryClient(
            <ShareChatModal
                chat={mockChat}
                open={true}
                onClose={mockOnClose}
                handleAlert={mockHandleAlert}
                profile={{} as any}
            />
        )

        await waitFor(() => {
            expect(getByText('Atualizar Link')).toBeInTheDocument()
        })
    })

    it('chama updateShared quando atualiza um compartilhamento existente', async () => {
        const mockShare = {
            id: 'existing-share-id',
            chat: { id: '1' }
        }
        ;(SharedSent as jest.Mock).mockResolvedValue([mockShare])
        ;(updateShared as jest.Mock).mockResolvedValue({ status: 201, message: 'Link do chat atualizado com sucesso.' })

        const { getByText } = renderWithQueryClient(
            <ShareChatModal
                chat={mockChat}
                open={true}
                onClose={mockOnClose}
                handleAlert={mockHandleAlert}
                profile={{} as any}
            />
        )

        await waitFor(() => {
            expect(getByText('Atualizar Link')).toBeInTheDocument()
        })

        fireEvent.click(getByText('Atualizar Link'))

        await waitFor(() => {
            expect(updateShared).toHaveBeenCalledWith('existing-share-id')
            expect(mockHandleAlert).toHaveBeenCalledWith('success', 'Link atualizado e copiado')
        })
    })
})
