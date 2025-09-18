import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MessageToast from '../../../components/message-toast/MessageToast'
import '@testing-library/jest-dom/extend-expect' // for additional assertions

describe('MessageToast Component', () => {
    it('should render the message toast with the provided message', () => {
        render(
            <MessageToast
                show={true}
                msg='Download successful!'
                datatestid='message-toast'
            />
        )

        expect(screen.getByText('Download successful!')).toBeInTheDocument()
    })

    it('should hide the message toast automatically after the specified duration', async () => {
        jest.useFakeTimers()

        render(
            <MessageToast
                show={true}
                msg='Operation completed'
                duration={2}
                datatestid='message-toast'
            />
        )

        const snackbar = screen.getByTestId('message-toast')

        expect(snackbar).toBeInTheDocument()

        jest.advanceTimersByTime(2000)

        jest.runAllTimers()

        await waitFor(() => {
            expect(screen.queryByTestId('message-toast')).toBeNull()
        })

        jest.useRealTimers()
    })

    it('should call onClose callback when close button is clicked', () => {
        const onCloseMock = jest.fn()

        render(
            <MessageToast
                show={true}
                msg='Download completed'
                onClose={onCloseMock}
                datatestid='message-toast'
            />
        )

        fireEvent.click(screen.getByTestId('btn-close-message'))

        expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('should not render the toast when show is false', () => {
        render(
            <MessageToast
                show={false}
                msg='This should not appear'
                datatestid='message-toast'
            />
        )

        expect(screen.queryByTestId('message-toast')).toBeNull()
    })

    it('should display the title when provided', () => {
        render(
            <MessageToast
                severity='info'
                show={true}
                msg='Something happened'
                title='Notification'
                duration={5}
                onClose={() => {}}
            />
        )

        const titleElement = screen.getByText(/Notification/i)
        expect(titleElement).toBeInTheDocument()
    })

    it('should display the message when provided', () => {
        render(
            <MessageToast
                severity='info'
                show={true}
                msg='Something happened'
                title='' // No title here
                duration={5}
                onClose={() => {}}
            />
        )

        const msgElement = screen.getByText(/Something happened/i)
        expect(msgElement).toBeInTheDocument()
    })
})
