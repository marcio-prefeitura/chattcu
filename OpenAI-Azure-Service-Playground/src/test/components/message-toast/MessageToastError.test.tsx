import { render, screen, fireEvent } from '@testing-library/react'
import MessageToastError from '../../../components/message-toast/MessageToastError'

describe('MessageToastError Component', () => {
    it('should render with the correct severity', () => {
        const messages = [{ erro: 'Test Error' }]
        render(
            <MessageToastError
                show={true}
                initialMsg={messages}
                severity='error'
            />
        )

        const alert = screen.getByRole('alert')
        expect(alert).toHaveClass('mensagem__erro')
    })

    it('should display the error message when provided', () => {
        const messages = [{ erro: 'Error 1' }, { erro: 'Error 2' }]
        render(
            <MessageToastError
                show={true}
                initialMsg={messages}
            />
        )

        expect(screen.getByText(/Error 1/)).toBeInTheDocument()
        expect(screen.getByText(/Error 2/)).toBeInTheDocument()
    })

    it('should trigger onClose when close button is clicked', () => {
        const onCloseMock = jest.fn()
        const messages = [{ erro: 'Test Error' }]
        render(
            <MessageToastError
                show={true}
                initialMsg={messages}
                onClose={onCloseMock}
            />
        )
        fireEvent.click(screen.getByTestId('CloseIcon'))

        expect(onCloseMock).toHaveBeenCalledWith(false)
    })
    it('should display each error message on a new line', () => {
        const messages = [{ erro: 'First Error' }, { erro: 'Second Error' }]
        render(
            <MessageToastError
                show={true}
                initialMsg={messages}
            />
        )

        const errorMessagesContainer = screen.getByText(/First Error.*Second Error/)
        expect(errorMessagesContainer).toBeInTheDocument()
        expect(errorMessagesContainer).toHaveTextContent('First Error')
        expect(errorMessagesContainer).toHaveTextContent('Second Error')

        const brTags = errorMessagesContainer.querySelectorAll('br')
        expect(brTags.length).toBeGreaterThanOrEqual(1)
    })
})
