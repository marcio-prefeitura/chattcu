import { render, screen, fireEvent } from '@testing-library/react'
import SharedActionsMenu, { SharedActionMenuType } from '../../../components/share-actions-menu/SharedActionsMenu'
import { ISharedChat } from '../../../infrastructure/utils/types'

const mockSharedChatItem: ISharedChat = {
    id: '1',
    usuario: 'test_user',
    st_removido: false,
    arquivos: [],
    chat: {
        id: 'chat1',
        mensagens: [],
        isLoading: false
    },
    data_compartilhamento: new Date(),
    destinatarios: [],
    message: 'This is a test message',
    timestamp: new Date()
}

const mockOnDeleteItem = jest.fn()
const mockHandleAlert = jest.fn()

jest.mock('../../../utils/AlertUtils', () => ({
    __esModule: true,
    default: () => ({
        alert: null,
        handleAlert: mockHandleAlert
    })
}))

jest.mock('../../../components/sidebar/sharing/ClipBoardUtils', () => ({
    handleCopyLink: jest.fn()
}))

describe('SharedActionsMenu component', () => {
    it('renders the menu button with the MoreVertRounded icon', () => {
        render(
            <SharedActionsMenu
                type={SharedActionMenuType.SENT}
                item={mockSharedChatItem}
                onDeleteItem={mockOnDeleteItem}
            />
        )
        const menuButton = screen.getByRole('button')
        expect(menuButton).toBeInTheDocument()
    })

    test('shows "Excluir chat recebida" for received items', () => {
        render(
            <SharedActionsMenu
                type={SharedActionMenuType.RECEIVED}
                item={mockSharedChatItem}
                onDeleteItem={mockOnDeleteItem}
            />
        )
        fireEvent.click(screen.getByRole('button'))
        const deleteText = screen.getByText(/Excluir chat recebido/i)
        expect(deleteText).toBeInTheDocument()
    })

    test('shows "Copiar link" and "Revogar link" for sent items', () => {
        render(
            <SharedActionsMenu
                type={SharedActionMenuType.SENT}
                item={mockSharedChatItem}
                onDeleteItem={mockOnDeleteItem}
            />
        )
        fireEvent.click(screen.getByRole('button'))
        const copyLink = screen.getByText(/Copiar link/i)
        const revokeLink = screen.getByText(/Revogar link/i)
        expect(copyLink).toBeInTheDocument()
        expect(revokeLink).toBeInTheDocument()
    })

    test('calls onDeleteItem when "Revogar link" is clicked', () => {
        render(
            <SharedActionsMenu
                type={SharedActionMenuType.SENT}
                item={mockSharedChatItem}
                onDeleteItem={mockOnDeleteItem}
            />
        )
        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText(/Revogar link/i))
        expect(mockOnDeleteItem).toHaveBeenCalledWith(mockSharedChatItem)
    })

    test('calls handleCopyLink when "Copiar link" is clicked', () => {
        const { handleCopyLink } = require('../../../components/sidebar/sharing/ClipBoardUtils')
        render(
            <SharedActionsMenu
                type={SharedActionMenuType.SENT}
                item={mockSharedChatItem}
                onDeleteItem={mockOnDeleteItem}
            />
        )
        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText(/Copiar link/i))
        expect(handleCopyLink).toHaveBeenCalledWith(mockSharedChatItem.id, expect.any(Function))
    })
})
