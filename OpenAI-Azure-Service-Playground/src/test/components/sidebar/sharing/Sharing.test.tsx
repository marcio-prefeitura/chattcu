/* eslint-disable @typescript-eslint/no-extra-semi */
import React from 'react'

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import * as ClipBoardUtils from '../../../../components/sidebar/sharing/ClipBoardUtils'
import Sharing from '../../../../components/sidebar/sharing/Sharing'
import * as api from '../../../../infrastructure/api'
import useAlert from '../../../../utils/AlertUtils'

jest.mock('../../../../infrastructure/api')
jest.mock('../../../../utils/AlertUtils')
jest.mock('../../../../components/sidebar/sharing/ClipBoardUtils')

const mockOnSharedChatSelect = jest.fn()

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

describe('Sharing Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(api.getAllSharedChats as jest.Mock).mockResolvedValue([
            { id: '1', chat: { titulo: 'Chat 1' } },
            { id: '2', chat: { titulo: 'Chat 2' } }
        ])
        ;(useAlert as jest.Mock).mockReturnValue({
            alert: null,
            handleAlert: jest.fn()
        })
        ;(ClipBoardUtils.handleCopyLink as jest.Mock).mockImplementation(() => {})
    })

    it('renderiza corretamente', async () => {
        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        await waitFor(() => {
            expect(screen.getByText('Chats compartilhados')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Filtrar compartilhados')).toBeInTheDocument()
        })
    })

    it('filtra chats corretamente', async () => {
        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        await waitFor(() => {
            expect(screen.getByText('Chat 1')).toBeInTheDocument()
            expect(screen.getByText('Chat 2')).toBeInTheDocument()
        })

        const filterInput = screen.getByPlaceholderText('Filtrar compartilhados')
        fireEvent.change(filterInput, { target: { value: 'Chat 1' } })

        await waitFor(() => {
            expect(screen.getByText('Chat 1')).toBeInTheDocument()
            expect(screen.queryByText('Chat 2')).not.toBeInTheDocument()
        })
    })

    it('chama a API para deletar um chat específico', async () => {
        ;(api.deleteSharingChat as jest.Mock).mockResolvedValue({ mensagem: 'Chat deletado com sucesso' })

        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        const moreButtons = await screen.findAllByTestId('more-button')
        fireEvent.click(moreButtons[0])

        const revokeButton = await screen.findByText('Revogar link')
        fireEvent.click(revokeButton)

        const confirmButton = await screen.findByText('Confirmar')
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(api.deleteSharingChat).toHaveBeenCalledWith('1')
        })
    })

    it('chama onSharedChatSelect quando um chat é selecionado', async () => {
        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        const chatItem = await screen.findByText('Chat 1')
        fireEvent.click(chatItem)

        expect(mockOnSharedChatSelect).toHaveBeenCalledWith(
            expect.objectContaining({ id: '1', chat: { titulo: 'Chat 1' } })
        )
    })

    it('abre modal de exclusão de um chat específico', async () => {
        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        const moreButtons = await screen.findAllByTestId('more-button')
        fireEvent.click(moreButtons[0])

        const deleteButton = await screen.findByText('Revogar link')
        fireEvent.click(deleteButton)

        expect(screen.getByText('Revogar Link compartilhado')).toBeInTheDocument()
    })

    it('exibe mensagem de erro quando falha ao carregar chats', async () => {
        ;(api.getAllSharedChats as jest.Mock).mockRejectedValue(new Error('Erro ao carregar chats'))

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Erro ao carregar chats enviados')
        })

        consoleSpy.mockRestore()
    })

    it('abre e fecha o modal de deletar um chat específico', async () => {
        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        const moreButtons = await screen.findAllByTestId('more-button')
        fireEvent.click(moreButtons[0])

        const deleteButton = await screen.findByText('Revogar link')
        fireEvent.click(deleteButton)

        expect(screen.getByText('Revogar Link compartilhado')).toBeInTheDocument()

        const cancelButton = screen.getByText('Cancelar')
        fireEvent.click(cancelButton)

        await waitFor(() => {
            expect(screen.queryByText('Revogar Link compartilhado')).not.toBeInTheDocument()
        })
    })

    it('atualiza a lista de compartilhados ao trocar de tab', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false
                }
            }
        })

        const { rerender } = render(
            <QueryClientProvider client={queryClient}>
                <Sharing onSharedChatSelect={mockOnSharedChatSelect} />
            </QueryClientProvider>
        )

        await waitFor(() => {
            expect(api.getAllSharedChats).toHaveBeenCalledTimes(1)
        })

        // Simula a troca de tab
        act(() => {
            rerender(
                <QueryClientProvider client={queryClient}>
                    <Sharing onSharedChatSelect={mockOnSharedChatSelect} />
                </QueryClientProvider>
            )
        })

        await waitFor(() => {
            expect(api.getAllSharedChats).toHaveBeenCalledTimes(2)
        })
    })

    it('renderiza SharingAccordion corretamente quando está carregando', async () => {
        // Cria uma Promise que nunca resolve para manter o estado de carregamento
        const neverResolve = new Promise(() => {})
        ;(api.getAllSharedChats as jest.Mock).mockReturnValue(neverResolve)

        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        await new Promise(resolve => setTimeout(resolve, 100))

        const loadingIndicator =
            screen.queryByText(/carregando/i) ||
            screen.queryByRole('progressbar') ||
            screen.queryByTestId('loading-indicator')

        if (loadingIndicator) {
            expect(loadingIndicator).toBeInTheDocument()
        } else {
            const mainContent = screen.queryByText('Chats compartilhados')
            expect(mainContent).not.toBeInTheDocument()

            throw new Error('Nenhum indicador de carregamento encontrado e o conteúdo principal não está presente')
        }
    })

    it('renderiza SharingAccordion corretamente quando há um erro', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        ;(api.getAllSharedChats as jest.Mock).mockRejectedValue(new Error('Erro ao carregar'))

        renderWithQueryClient(<Sharing onSharedChatSelect={mockOnSharedChatSelect} />)

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Erro ao carregar chats enviados')
        })

        await new Promise(resolve => setTimeout(resolve, 0))

        consoleSpy.mockRestore()
    })
})
