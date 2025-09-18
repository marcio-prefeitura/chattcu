import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { IChat, IMessageHistory } from '../../../infrastructure/utils/types'
import { IUserInfo } from '../../../hooks/useUserInfo'
import ChatActionsMenu from '../../../components/chat-actions-menu/ChatActionsMenu'

const msgHistory: IMessageHistory[] = [
    {
        conteudo: 'Mensagem 1',
        papel: 'USER'
    },
    {
        conteudo: 'Mensagem 2',
        papel: 'ASSISTANT'
    }
]
const mockChat: IChat = {
    id: '1',
    titulo: 'Test Chat',
    mensagens: msgHistory,
    isLoading: false
}

const mockProfile: IUserInfo = {
    login: '',
    perfilDev: false,
    perfilDevOrPreview: true,
    perfilPreview: false,
    name: '',
    initialLetters: ''
}

const mockHandleFixOnTop = jest.fn()
const mockHandleArchiveChat = jest.fn()
const mockHandleStartShareChat = jest.fn()
const mockHandleInputChange = jest.fn()
const mockHandleEditChat = jest.fn()
const mockHandleDeleteChat = jest.fn()

describe('ChatActionsMenu', () => {
    beforeEach(() => {
        render(
            <ChatActionsMenu
                profile={mockProfile}
                chat={mockChat}
                handleFixOnTop={mockHandleFixOnTop}
                handleArchiveChat={mockHandleArchiveChat}
                handleStartShareChat={mockHandleStartShareChat}
                handleInputChange={mockHandleInputChange}
                handleEditChat={mockHandleEditChat}
                handleDeleteChat={mockHandleDeleteChat}
                isPinned={false}
            />
        )
    })

    test('should render menu button', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        expect(menuButton).toBeInTheDocument()
    })

    test('should open and close menu on button click', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        fireEvent.click(menuButton)

        const menu = screen.getByRole('menu')
        expect(menu).toBeInTheDocument()

        fireEvent.click(document.body)
        expect(menu).toBeVisible()
    })

    test('should call handleFixOnTop when pin button is clicked', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        fireEvent.click(menuButton)

        const pinButton = screen.getByTestId(`pin-button-${mockChat.id}`)
        fireEvent.click(pinButton)

        expect(mockHandleFixOnTop).toHaveBeenCalledWith(mockChat)
    })

    test('should call handleEditChat when edit button is clicked', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        fireEvent.click(menuButton)

        const editButton = screen.getByTestId(`edit-button-${mockChat.id}`)
        fireEvent.click(editButton)

        expect(screen.getByText('Renomear')).toBeInTheDocument()
    })

    test('should call handleDeleteChat when delete button is clicked', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        fireEvent.click(menuButton)

        const deleteButton = screen.getByTestId(`delete-button-${mockChat.id}`)
        fireEvent.click(deleteButton)

        expect(screen.getByText('Excluir')).toBeInTheDocument()
    })
    test('should call handleDeleteChat and close the modal when delete button is clicked', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        fireEvent.click(menuButton)

        const deleteButton = screen.getByTestId(`delete-button-${mockChat.id}`)
        fireEvent.click(deleteButton)

        const confirmDeleteButton = screen.getByTestId('confirm-delete-button') // Assuming there's a confirm button in the modal
        fireEvent.click(confirmDeleteButton)

        expect(mockHandleDeleteChat).toHaveBeenCalledWith(mockChat)

        expect(screen.queryByTestId('delete-chat-modal')).not.toBeInTheDocument() // Ensure modal is no longer visible
    })

    test('should call handleArchiveChat when archive button is clicked', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        fireEvent.click(menuButton)

        const archiveButton = screen.getByText('Arquivar')
        fireEvent.click(archiveButton)

        expect(mockHandleArchiveChat).toHaveBeenCalledWith(mockChat)
    })

    test('should call handleStartShareChat when share button is clicked', () => {
        const menuButton = screen.getByTestId(`menu-button-${mockChat.id}`)
        fireEvent.click(menuButton)

        const shareButton = screen.getByText('Compartilhar chat')
        fireEvent.click(shareButton)

        expect(mockHandleStartShareChat).toHaveBeenCalledWith(mockChat)
    })

    test('should render archive and share buttons', () => {
        const mockChat2: IChat = {
            id: '2',
            titulo: 'Test Chat',
            mensagens: msgHistory,
            isLoading: false
        }
        render(
            <ChatActionsMenu
                profile={mockProfile}
                chat={mockChat2}
                handleFixOnTop={mockHandleFixOnTop}
                handleArchiveChat={mockHandleArchiveChat}
                handleStartShareChat={mockHandleStartShareChat}
                handleInputChange={mockHandleInputChange}
                handleEditChat={mockHandleEditChat}
                handleDeleteChat={mockHandleDeleteChat}
                isPinned={false}
            />
        )

        const menuButton = screen.getByTestId(`menu-button-${mockChat2.id}`)
        fireEvent.click(menuButton)

        const shareButton = screen.getByTestId(`share-chat-button-${mockChat2.id}`)
        const archiveButton = screen.getByTestId(`archive-chat-button-${mockChat2.id}`)

        expect(shareButton).toBeInTheDocument()
        expect(archiveButton).toBeInTheDocument()
    })

    test('should render unpin button when isPinned is true', () => {
        const mockChat3: IChat = {
            id: '3',
            titulo: 'Test Chat',
            mensagens: msgHistory,
            isLoading: false
        }
        render(
            <ChatActionsMenu
                profile={mockProfile}
                chat={mockChat3}
                handleFixOnTop={mockHandleFixOnTop}
                handleArchiveChat={mockHandleArchiveChat}
                handleStartShareChat={mockHandleStartShareChat}
                handleInputChange={mockHandleInputChange}
                handleEditChat={mockHandleEditChat}
                handleDeleteChat={mockHandleDeleteChat}
                isPinned={true}
            />
        )

        const menuButton = screen.getByTestId(`menu-button-${mockChat3.id}`)
        fireEvent.click(menuButton)

        const unpinButton = screen.getByTestId(`unpin-button-actions-${mockChat3.id}`)
        expect(unpinButton).toBeInTheDocument()
    })
})
