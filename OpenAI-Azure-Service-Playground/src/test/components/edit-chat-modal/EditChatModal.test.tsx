import { render, fireEvent } from '@testing-library/react'
import EditChatModal from '../../../components/edit-chat-modal/EditChatModal'
import { IChat } from '../../../infrastructure/utils/types'

describe('EditChatModal', () => {
    const handleOpenModal = jest.fn()
    const handleEditChat = jest.fn()
    const handleInputChange = jest.fn()

    const chat: IChat = {
        id: '1',
        titulo: 'Chat Original',
        mensagens: [],
        isLoading: false
    }

    beforeEach(() => {
        handleOpenModal.mockClear()
        handleEditChat.mockClear()
        handleInputChange.mockClear()
    })

    it('should render the modal when openModalEditChat is true', () => {
        const { getByText } = render(
            <EditChatModal
                openModalEditChat={true}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleEditChat={handleEditChat}
                handleInputChange={handleInputChange}
            />
        )

        expect(getByText('Renomear chat')).toBeInTheDocument()
        expect(getByText('Digite o novo título do chat')).toBeInTheDocument()
    })

    it('should not render the modal when openModalEditChat is false', () => {
        const { queryByText } = render(
            <EditChatModal
                openModalEditChat={false}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleEditChat={handleEditChat}
                handleInputChange={handleInputChange}
            />
        )

        expect(queryByText('Renomear chat')).toBeNull()
        expect(queryByText('Digite o novo título do chat')).toBeNull()
    })

    it('should call handleOpenModal with false when the close button is clicked', () => {
        const { getByRole } = render(
            <EditChatModal
                openModalEditChat={true}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleEditChat={handleEditChat}
                handleInputChange={handleInputChange}
            />
        )

        fireEvent.click(getByRole('button', { name: '' }))

        expect(handleOpenModal).toHaveBeenCalledWith(false)
    })

    it('should call handleEditChat and handleClose when the confirm button is clicked with a valid title', () => {
        const { getByRole } = render(
            <EditChatModal
                openModalEditChat={true}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleEditChat={handleEditChat}
                handleInputChange={handleInputChange}
            />
        )

        const textField = getByRole('textbox')
        fireEvent.change(textField, { target: { value: 'New Chat Title' } })

        const confirmButton = getByRole('button', { name: 'Confirmar' })
        fireEvent.click(confirmButton)

        expect(handleEditChat).toHaveBeenCalledWith({ ...chat, titulo: 'New Chat Title' })
        expect(handleOpenModal).toHaveBeenCalledWith(false)
    })

    it('should not call handleEditChat and handleClose when the confirm button is clicked with an invalid title', () => {
        const { getByRole } = render(
            <EditChatModal
                openModalEditChat={true}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleEditChat={handleEditChat}
                handleInputChange={handleInputChange}
            />
        )

        const textField = getByRole('textbox')
        fireEvent.change(textField, { target: { value: '' } })

        const confirmButton = getByRole('button', { name: 'Confirmar' })
        fireEvent.click(confirmButton)

        expect(handleEditChat).not.toHaveBeenCalled()
        expect(handleOpenModal).not.toHaveBeenCalled()
    })
})
