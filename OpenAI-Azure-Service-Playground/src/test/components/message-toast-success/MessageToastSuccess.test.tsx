import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MessageToastSuccess from '../../../components/message-toast/MessageToastSuccess'
import '@testing-library/jest-dom'

const mockMessages = [{ message: 'Download completed successfully!' }]

describe('MessageToastSuccess Component', () => {
    it('should render the success message correctly when show is true', () => {
        render(
            <MessageToastSuccess
                show={true}
                initialMsg={mockMessages}
            />
        )

        const successMessage = screen.getByText('Download completed successfully!')
        expect(successMessage).toBeInTheDocument()
    })

    it('should not render the success message when show is false', () => {
        render(
            <MessageToastSuccess
                show={false}
                initialMsg={mockMessages}
            />
        )

        const successMessage = screen.queryByText('Download completed successfully!')
        expect(successMessage).not.toBeInTheDocument()
    })

    it('should call onClose when the close button is clicked', async () => {
        const onCloseMock = jest.fn()
        render(
            <MessageToastSuccess
                show={true}
                initialMsg={mockMessages}
                onClose={onCloseMock}
            />
        )

        const closeButton = screen.getByRole('button', { name: /close/i })
        fireEvent.click(closeButton)

        await waitFor(() => expect(onCloseMock).toHaveBeenCalledTimes(1))
    })

    it('should display multiple success messages when passed', () => {
        const messages = [{ message: 'First success message' }, { message: 'Second success message' }]

        render(
            <MessageToastSuccess
                show={true}
                initialMsg={messages}
            />
        )

        expect(screen.getByText(/First success message/)).toBeInTheDocument()
        expect(screen.getByText(/Second success message/)).toBeInTheDocument()
    })
})
