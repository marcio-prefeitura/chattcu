import { render, screen, fireEvent } from '@testing-library/react'
import MessageToastDownload from '../../../components/message-toast/MessageToastDownload'
import '@testing-library/jest-dom'

describe('MessageToastDownload Component', () => {
    it('should render the component when show is true', () => {
        const message = 'Downloading file...'
        render(
            <MessageToastDownload
                show={true}
                message={message}
            />
        )

        const messageElement = screen.getByText(message)
        expect(messageElement).toBeInTheDocument()
    })

    it('should not render the component when show is false', () => {
        const message = 'Downloading file...'
        render(
            <MessageToastDownload
                show={false}
                message={message}
            />
        )

        const messageElement = screen.queryByText(message)
        expect(messageElement).not.toBeInTheDocument()
    })

    it('should trigger the onClose function when close button is clicked', () => {
        const message = 'Downloading file...'
        const onCloseMock = jest.fn()

        render(
            <MessageToastDownload
                show={true}
                message={message}
                onClose={onCloseMock}
            />
        )

        const closeButton = screen.getByTestId('btn-close-download-message')
        fireEvent.click(closeButton)

        expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('should render with the correct data-testid attribute', () => {
        const message = 'Downloading file...'
        const testId = 'download-toast-test-id'

        render(
            <MessageToastDownload
                show={true}
                message={message}
                datatestid={testId}
            />
        )

        const snackbarElement = screen.getByTestId(testId)
        expect(snackbarElement).toBeInTheDocument()
    })

    it('should show a CircularProgress indicator while downloading', () => {
        const message = 'Downloading file...'

        render(
            <MessageToastDownload
                show={true}
                message={message}
            />
        )

        const circularProgress = screen.getByRole('progressbar')
        expect(circularProgress).toBeInTheDocument()
    })
})
