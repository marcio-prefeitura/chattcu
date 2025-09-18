import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import CounterWords from '../../../components/counter-words/CounterWords'

jest.mock('@mui/material', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => children
}))

describe('CounterWords Component', () => {
    const mockNewChatButton = document.createElement('button')

    beforeEach(() => {
        mockNewChatButton.setAttribute('data-testid', 'new-chat')
        document.body.appendChild(mockNewChatButton)
    })

    afterEach(() => {
        if (document.body.contains(mockNewChatButton)) {
            document.body.removeChild(mockNewChatButton)
        }
        jest.clearAllMocks()
    })

    test('renderiza o contador quando count é menor que total', () => {
        render(
            <CounterWords
                count={5}
                total={10}
            />
        )

        const contador = screen.getByTestId('contador-input')
        const value = screen.getByText('5 / 10')

        expect(contador).toBeInTheDocument()
        expect(value).toBeInTheDocument()
        expect(contador).toHaveClass('chat-box__contador')
    })

    test('renderiza mensagem de limite excedido quando count é igual ao total', () => {
        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const contador = screen.getByTestId('contador-input-max')

        const message = screen.getByText(/Limite excedido/i)
        const link = screen.getByText(/crie um novo chat/i)

        expect(contador).toBeInTheDocument()
        expect(message).toBeInTheDocument()
        expect(link).toBeInTheDocument()
        expect(contador).toHaveClass('chat-box__contador', 'chat-blocked')
    })

    test('executa handleClick ao clicar no link de novo chat', () => {
        const mockClick = jest.fn()
        mockNewChatButton.onclick = mockClick

        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const link = screen.getByText(/crie um novo chat/i)
        fireEvent.click(link)

        expect(mockClick).toHaveBeenCalled()
    })

    test('executa handleKeyDown com Enter', () => {
        const mockClick = jest.fn()
        mockNewChatButton.onclick = mockClick

        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const link = screen.getByText(/crie um novo chat/i)
        fireEvent.keyDown(link, { key: 'Enter' })

        expect(mockClick).toHaveBeenCalled()
    })

    test('executa handleKeyDown com Space', () => {
        const mockClick = jest.fn()
        mockNewChatButton.onclick = mockClick

        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const link = screen.getByText(/crie um novo chat/i)
        fireEvent.keyDown(link, { key: ' ' })

        expect(mockClick).toHaveBeenCalled()
    })

    test('não executa handleClick para outras teclas', () => {
        const mockClick = jest.fn()
        mockNewChatButton.onclick = mockClick

        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const link = screen.getByText(/crie um novo chat/i)
        fireEvent.keyDown(link, { key: 'Tab' })

        expect(mockClick).not.toHaveBeenCalled()
    })

    test('verifica atributos de acessibilidade do link', () => {
        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const link = screen.getByText(/crie um novo chat/i)

        expect(link).toHaveAttribute('role', 'button')
        expect(link).toHaveAttribute('tabIndex', '0')
        expect(link).toHaveClass('chat-box__dica-link')
    })

    test('não executa handleClick quando newChatButton não existe', () => {
        if (document.body.contains(mockNewChatButton)) {
            document.body.removeChild(mockNewChatButton)
        }

        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const link = screen.getByText(/crie um novo chat/i)
        fireEvent.click(link)
    })

    test('previne eventos padrão no handleClick', () => {
        render(
            <CounterWords
                count={10}
                total={10}
            />
        )

        const link = screen.getByText(/crie um novo chat/i)
        const mockMouseEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
        })

        // Mock das funções
        mockMouseEvent.preventDefault = jest.fn()
        mockMouseEvent.stopPropagation = jest.fn()

        // Disparar o evento
        link.dispatchEvent(mockMouseEvent)

        expect(mockMouseEvent.preventDefault).toHaveBeenCalledTimes(1)
        expect(mockMouseEvent.stopPropagation).toHaveBeenCalledTimes(1)
    })
})
