import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageToastGroup from '../../../components/message-toast-group/MessageToastGroup'
import { waitFor } from '@testing-library/react'

jest.mock('../../../components/message-toast/MessageToastDownload', () => ({ show, message, onClose }: any) => (
    <div data-testid='message-toast-download'>
        {show ? message : null}
        {show && <button onClick={onClose}>Close</button>}
    </div>
))

jest.mock('../../../components/message-toast/MessageToast', () => ({ severity, show, msg, onClose }: any) => (
    <div
        data-testid='message-toast'
        className={severity}>
        {show ? msg : null}
        <button onClick={onClose}>Close</button>
    </div>
))

jest.mock(
    '../../../components/message-toast/MessageToastError',
    () =>
        ({ severity, show, initialMsg, onClose }: any) =>
            (
                <div
                    data-testid='message-toast-error'
                    className={severity}>
                    {show ? initialMsg : null}
                    <button onClick={onClose}>Close</button>
                </div>
            )
)

describe('MessageToastGroup', () => {
    const mockSetIsDownloading = jest.fn()
    const mockSetShowCopySuccess = jest.fn()
    const mockSetShowCopyError = jest.fn()
    const mockSetShowMoveSuccess = jest.fn()
    const mockSetMoveShowError = jest.fn()

    const defaultProps = {
        isDownloading: false,
        copyShowSucess: false,
        copySucessMessage: 'Success!',
        copyShowError: false,
        copyErrorMessage: ['Error!'],
        moveShowSucess: false,
        moveSucessMessage: 'Move Success!',
        moveShowError: false,
        moveErrorMessage: ['Move Error!'],
        setIsDownloading: mockSetIsDownloading,
        setShowCopySuccess: mockSetShowCopySuccess,
        setShowCopyError: mockSetShowCopyError,
        setShowMoveSuccess: mockSetShowMoveSuccess,
        setMoveShowError: mockSetMoveShowError
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('description of your test', async () => {
        // Your test code here
        await waitFor(() => {
            // Your assertion code
        })
    })

    it('should render without crashing', () => {
        render(<MessageToastGroup {...defaultProps} />)
        expect(screen.getByTestId('message-toast-download')).toBeInTheDocument()
        expect(screen.queryAllByTestId('message-toast')).toHaveLength(2)
        expect(screen.queryAllByTestId('message-toast-error')).toHaveLength(2)
    })

    it('should render MessageToastDownload when isDownloading is true', () => {
        const props = { ...defaultProps, isDownloading: true }
        render(<MessageToastGroup {...props} />)
        expect(screen.getByTestId('message-toast-download')).toHaveTextContent('Download iniciado, aguarde...')
    })

    it('should render MessageToast when copyShowSucess is true', () => {
        const props = { ...defaultProps, copyShowSucess: true }
        render(<MessageToastGroup {...props} />)
        const messageToasts = screen.queryAllByTestId('message-toast')
        expect(messageToasts).toHaveLength(2)
        expect(messageToasts[0]).toHaveClass('info')
        expect(messageToasts[0]).toHaveTextContent('Success!')
    })

    it('should render MensagemErro when copyShowError is true', () => {
        const props = { ...defaultProps, copyShowError: true }
        render(<MessageToastGroup {...props} />)
        const messageToastErrors = screen.queryAllByTestId('message-toast-error')
        expect(messageToastErrors).toHaveLength(2)
        expect(messageToastErrors[0]).toHaveClass('warning')
        expect(messageToastErrors[0]).toHaveTextContent('Error!')
    })

    it('should call onClose when close button is clicked for MessageToast', () => {
        const props = { ...defaultProps, copyShowSucess: true }
        render(<MessageToastGroup {...props} />)
        const closeButtons = screen.getAllByText('Close')
        const successCloseButton = closeButtons.find(button => button.closest('.info'))
        if (!successCloseButton) {
            throw new Error('Success close button not found')
        }
        fireEvent.click(successCloseButton)
        expect(mockSetShowCopySuccess).toHaveBeenCalledWith(false)
    })

    it('should call onClose when close button is clicked for MensagemErro', () => {
        const props = { ...defaultProps, copyShowError: true }
        render(<MessageToastGroup {...props} />)
        const closeButtons = screen.getAllByText('Close')
        const errorCloseButton = closeButtons.find(button => button.closest('.warning'))
        if (!errorCloseButton) {
            throw new Error('Error close button not found')
        }
        fireEvent.click(errorCloseButton)
        expect(mockSetShowCopyError).toHaveBeenCalledWith(false)
    })
    it('should call onClose when close button is clicked for MessageToastDownload', () => {
        const props = { ...defaultProps, isDownloading: true }
        render(<MessageToastGroup {...props} />)
        const closeButtons = screen.getAllByText('Close')
        const downloadCloseButton = closeButtons.find(button =>
            button.closest('[data-testid="message-toast-download"]')
        )
        if (!downloadCloseButton) {
            throw new Error('Download close button not found')
        }
        fireEvent.click(downloadCloseButton)
        expect(props.setIsDownloading).toHaveBeenCalledWith(false)
    })
})
