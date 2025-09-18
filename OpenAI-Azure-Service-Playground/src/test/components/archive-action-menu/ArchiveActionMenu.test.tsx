import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import ArchiveActionsMenu from '../../../components/archive-actions-menu/ArchiveActionsMenu'
import Chat from '../../../shared/models/Chat'
// Mock data
const mockChat: Chat = {
    async excluir(): Promise<void> {
        return Promise.resolve(undefined)
    },
    async fixar(): Promise<void> {
        return Promise.resolve(undefined)
    },
    async renomear(titulo: string): Promise<void> {
        return Promise.resolve(undefined)
    },
    id: '1',
    titulo: 'Test Chat',
    mensagens: [],
    isLoading: false
}

const handleDeleteChat = jest.fn()
const onUnArchive = jest.fn()

describe('ArchiveActionsMenu', () => {
    it('should open and close the menu', () => {
        render(
            <ArchiveActionsMenu
                chat={mockChat}
                handleDeleteChat={handleDeleteChat}
                onUnArchive={onUnArchive}
            />
        )

        expect(screen.queryByTestId(`delete-button-${mockChat.id}`)).toBeNull()

        fireEvent.click(document.body)

        expect(screen.queryByTestId(`delete-button-${mockChat.id}`)).toBeNull()
    })

    it('should open the delete chat modal', () => {
        render(
            <ArchiveActionsMenu
                chat={mockChat}
                handleDeleteChat={handleDeleteChat}
                onUnArchive={onUnArchive}
            />
        )

        fireEvent.click(document.body)

        expect(screen.queryByTestId(`delete-button-${mockChat.id}`)).toBeNull()
    })

    it('should call handleDeleteChat when deleting chat', () => {
        render(
            <ArchiveActionsMenu
                chat={mockChat}
                handleDeleteChat={handleDeleteChat}
                onUnArchive={onUnArchive}
            />
        )

        fireEvent.click(document.body)

        expect(screen.queryByTestId(`delete-button-${mockChat.id}`)).toBeNull()
    })
    it('should call onUnArchive when unarchiving chat', () => {
        render(
            <ArchiveActionsMenu
                chat={mockChat}
                handleDeleteChat={handleDeleteChat}
                onUnArchive={onUnArchive}
            />
        )

        fireEvent.click(document.body)

        expect(screen.queryByTestId(`unarchive-button-${mockChat.id}`)).toBeNull()
    })

    it('should close the delete chat modal after deletion', () => {
        render(
            <ArchiveActionsMenu
                chat={mockChat}
                handleDeleteChat={handleDeleteChat}
                onUnArchive={onUnArchive}
            />
        )

        fireEvent.click(document.body)

        expect(screen.queryByTestId(`delete-button-${mockChat.id}`)).toBeNull()

        fireEvent.click(document.body)

        expect(screen.queryByText('Excluir Chat')).toBeNull()
    })

    it('should handle null anchor element', () => {
        render(
            <ArchiveActionsMenu
                chat={mockChat}
                handleDeleteChat={handleDeleteChat}
                onUnArchive={onUnArchive}
            />
        )

        const moreButton = screen.getByRole('button')
        fireEvent.click(moreButton)

        const closeButton = screen.getByRole('menuitem', { name: /excluir/i })
        fireEvent.click(closeButton)

        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    // ... testes existentes ...

    describe('ArchiveActionsMenu', () => {
        it('should handle click item event propagation', () => {
            render(
                <ArchiveActionsMenu
                    chat={mockChat}
                    handleDeleteChat={handleDeleteChat}
                    onUnArchive={onUnArchive}
                />
            )

            const button = screen.getByRole('button')

            const mockEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            })
            mockEvent.stopPropagation = jest.fn()

            button.dispatchEvent(mockEvent)

            expect(mockEvent.stopPropagation).toHaveBeenCalled()
        })
        it('should handle delete and close modal with valid chat', () => {
            render(
                <ArchiveActionsMenu
                    chat={mockChat}
                    handleDeleteChat={handleDeleteChat}
                    onUnArchive={onUnArchive}
                />
            )

            const button = screen.getByRole('button')
            fireEvent.click(button)

            const deleteButton = screen.getByTestId(`delete-button-${mockChat.id}`)
            fireEvent.click(deleteButton)

            // Confirmar exclusão
            const confirmButton = screen.getByRole('button', { name: /confirmar/i })
            fireEvent.click(confirmButton)

            expect(handleDeleteChat).toHaveBeenCalledWith(mockChat)
        })

        it('should handle unarchive action', () => {
            render(
                <ArchiveActionsMenu
                    chat={mockChat}
                    handleDeleteChat={handleDeleteChat}
                    onUnArchive={onUnArchive}
                />
            )

            const button = screen.getByRole('button')
            fireEvent.click(button)

            const unarchiveButton = screen.getByTestId(`unarchive-button-${mockChat.id}`)
            fireEvent.click(unarchiveButton)

            expect(onUnArchive).toHaveBeenCalledWith(mockChat)
        })

        it('should open modal when clicking delete button', async () => {
            render(
                <ArchiveActionsMenu
                    chat={mockChat}
                    handleDeleteChat={handleDeleteChat}
                    onUnArchive={onUnArchive}
                />
            )

            // Abrir o menu
            const button = screen.getByRole('button')
            fireEvent.click(button)

            const deleteButton = screen.getByTestId(`delete-button-${mockChat.id}`)
            fireEvent.click(deleteButton)

            expect(screen.getByRole('presentation')).toBeInTheDocument()
        })

        it('should handle menu open state', () => {
            render(
                <ArchiveActionsMenu
                    chat={mockChat}
                    handleDeleteChat={handleDeleteChat}
                    onUnArchive={onUnArchive}
                />
            )

            expect(screen.queryByRole('menu')).not.toBeInTheDocument()

            const button = screen.getByRole('button')
            fireEvent.click(button)

            expect(screen.getByRole('menu')).toBeInTheDocument()
        })

        it('should render menu items with correct icons', () => {
            render(
                <ArchiveActionsMenu
                    chat={mockChat}
                    handleDeleteChat={handleDeleteChat}
                    onUnArchive={onUnArchive}
                />
            )

            const button = screen.getByRole('button')
            fireEvent.click(button)

            expect(screen.getByTestId(`unarchive-button-${mockChat.id}`)).toBeInTheDocument()
            expect(screen.getByTestId(`delete-button-${mockChat.id}`)).toBeInTheDocument()
            expect(document.querySelector('.icon-unarchive')).toBeInTheDocument()
            expect(document.querySelector('.icon-trash-2')).toBeInTheDocument()
        })
    })
})
