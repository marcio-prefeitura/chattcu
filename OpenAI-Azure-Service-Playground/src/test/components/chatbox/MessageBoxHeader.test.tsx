import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import MessageBoxHeader from '../../../components/chat-box/MessageBoxHeader'

describe('MessageBoxHeader Component', () => {
    it('renders the MessageBoxHeader with the correct title', () => {
        const mockChatTitulo = 'Test Chat Title'
        render(<MessageBoxHeader chatTitulo={mockChatTitulo} />)

        const headerElement = screen.getByText(mockChatTitulo)
        expect(headerElement).toBeInTheDocument()
    })

    it('renders an empty Box when chatTitulo is an empty string', () => {
        render(<MessageBoxHeader chatTitulo='' />)

        const headerElement = screen.getByTestId('message-box-header')
        expect(headerElement).toBeInTheDocument()
        expect(headerElement).toHaveTextContent('')
    })

    it('handles special characters in chatTitulo correctly', () => {
        const mockChatTitulo = 'Título com caracteres especiais: @#$%&*'
        render(<MessageBoxHeader chatTitulo={mockChatTitulo} />)

        const headerElement = screen.getByText(mockChatTitulo)
        expect(headerElement).toBeInTheDocument()
    })
})
