import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import DeleteChatModel from '../../../components/delete-chat-modal/DeleteChatModel'
import { IChat } from '../../../infrastructure/utils/types'

describe('DeleteChatModel', () => {
    const handleOpenModal = jest.fn()
    const handleDeleteChat = jest.fn()

    const chat: IChat = {
        id: '1',
        titulo: 'Chat de Teste',
        mensagens: [],
        isLoading: false
    }

    beforeEach(() => {
        handleOpenModal.mockClear()
        handleDeleteChat.mockClear()
    })

    test('não deve renderizar o modal quando openModalDeleteChat for false', () => {
        const { queryByText } = render(
            <DeleteChatModel
                openModalDeleteChat={false}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleDeleteChat={handleDeleteChat}
            />
        )

        expect(queryByText('Excluir chats')).toBeNull()
        expect(queryByText('Tem certeza que deseja excluir o chat')).toBeNull()
    })

    test('deve chamar handleOpenModal com true quando o botão Fechar for clicado', () => {
        const chat = { id: '1', titulo: 'Chat de Teste', mensagens: [], isLoading: false }
        const { getByRole } = render(
            <DeleteChatModel
                openModalDeleteChat={true}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleDeleteChat={handleDeleteChat}
            />
        )

        fireEvent.click(getByRole('button', { name: '' }))
        expect(handleOpenModal).toHaveBeenCalledWith(false)
    })

    test('deve chamar handleDeleteChat quando o botão de confirmação for clicado', () => {
        const chat = { id: '1', titulo: 'Chat de Teste', mensagens: [], isLoading: false }
        const { getByText } = render(
            <DeleteChatModel
                openModalDeleteChat={true}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleDeleteChat={handleDeleteChat}
            />
        )

        fireEvent.click(getByText('Confirmar'))
        expect(handleDeleteChat).toHaveBeenCalledWith(chat)
    })

    it('deve mostrar a mensagem de sucesso quando showSuccess for true', () => {
        const { queryByText } = render(
            <DeleteChatModel
                openModalDeleteChat={true}
                chat={chat}
                handleOpenModal={handleOpenModal}
                handleDeleteChat={handleDeleteChat}
            />
        )

        expect(queryByText('Chat Excluido')).toBeNull()
    })
})
