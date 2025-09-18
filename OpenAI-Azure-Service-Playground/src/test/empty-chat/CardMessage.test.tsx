import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import { Box } from '@mui/material'
import CardMessage from '../../components/empty-chat/CardMessage'

describe('CardMessage Component', () => {
    const mockIcon = <Box data-testid='mock-icon'>Icon</Box>
    const mockMessage = 'Test Message'

    it('should render the message', () => {
        const mockMessage = 'Test Message'
        const mockIcon = <div data-testid='mock-icon'>Icon</div>

        render(
            <CardMessage
                message={mockMessage}
                icone={mockIcon}
                onClick={() => {}}
            />
        )

        const textElement = screen.getByText(content => content.includes(mockMessage))
        expect(textElement).toBeInTheDocument()
    })

    it('should render the icon when provided', () => {
        const mockMessage = 'Test Message'
        const mockIcon = <div data-testid='mock-icon'>Icon</div>

        render(
            <CardMessage
                message={mockMessage}
                icone={mockIcon}
                onClick={() => {}}
            />
        )

        expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('should not render the icon when not provided', () => {
        render(
            <CardMessage
                message={mockMessage}
                icone={mockIcon}
            />
        )
        expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
    })

    it('should not call onClick when onClick is not provided', () => {
        const mockMessage = 'Test Message'
        const mockIcon = <div data-testid='mock-icon'>Icon</div>
        const mockOnClick = jest.fn()
        render(
            <CardMessage
                message={mockMessage}
                icone={mockIcon}
                onClick={mockOnClick}
            />
        )
        const container = screen.getByText(mockMessage)
        fireEvent.click(container)
        expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should render an empty state when both onClick and icon are not provided', () => {
        const mockMessage = 'Test Message'
        const mockIcon = <div data-testid='mock-icon'>Icon</div>
        const mockOnClick = jest.fn()

        render(
            <CardMessage
                message={mockMessage}
                icone={mockIcon}
                onClick={mockOnClick}
            />
        )

        const container = screen.getByText(mockMessage)
        fireEvent.click(container)
        expect(screen.queryByTestId('icon')).toBeInTheDocument()
    })
    it('should render the icon when `icone` is provided', () => {
        const mockOnClick = jest.fn()
        render(
            <CardMessage
                message={mockMessage}
                icone={mockIcon}
                onClick={mockOnClick}
            />
        )

        const iconElement = screen.getByTestId('mock-icon')
        expect(iconElement).toBeInTheDocument()
    })
})
