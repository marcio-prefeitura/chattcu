import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import removeMd from 'remove-markdown'
import Actions from '../../../../components/chat-box/message/actions/Actions'
import { IFeedback } from '../../../../infrastructure/utils/types'
jest.mock('remove-markdown')
jest.mock('../../../../components/message-toast/MessageToast', () =>
    jest.fn(props => (
        <div
            {...props}
            data-testid='message-toast'>
            MessageToast: {props.msg}
        </div>
    ))
)

describe('Actions component', () => {
    const mockOnOpenFeedbackDialog = jest.fn()
    const mockHandleAlert = jest.fn()

    const props = {
        cod_message: '123',
        message: '# Hello World',
        feedback: undefined,
        reacao: 'LIKED',
        onOpenFeedbackDialog: mockOnOpenFeedbackDialog,
        handleAlert: mockHandleAlert
    }

    beforeEach(() => {
        jest.clearAllMocks()
        removeMd.mockReturnValue('Hello World')
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    test('handles like button click', () => {
        render(<Actions {...props} />)

        const likeButton = screen.getByLabelText('Gostei')
        fireEvent.click(likeButton)

        expect(mockOnOpenFeedbackDialog).toHaveBeenCalledWith('123', 'LIKED')
    })

    test('handles dislike button click', () => {
        render(<Actions {...props} />)

        const dislikeButton = screen.getByLabelText('Não Gostei')
        fireEvent.click(dislikeButton)

        expect(mockOnOpenFeedbackDialog).toHaveBeenCalledWith('123', 'DISLIKED')
    })

    test('handles alternative copy method on failure', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockRejectedValue(new Error('copy failed'))
            }
        })

        const props = {
            cod_message: '123',
            message: '# Hello World',
            reacao: undefined,
            onOpenFeedbackDialog: mockOnOpenFeedbackDialog
        }

        render(<Actions {...props} />)
        const copyButton = screen.getByLabelText('Copiar')

        await act(async () => {
            await fireEvent.click(copyButton)
        })

        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error))

        expect(screen.queryByTestId('message-toast')).not.toBeInTheDocument()

        consoleSpy.mockRestore()
    })

    test('shows correct icons based on feedback state like', () => {
        const feedbackLikedMock: IFeedback = {
            chat_id: '1',
            cod_mensagem: '123',
            conteudo: 'teste',
            inveridico: false,
            nao_ajudou: false,
            ofensivo: false,
            reacao: 'LIKED'
        }
        const likedProps = {
            ...props,
            feedback: feedbackLikedMock,
            cod_message: '123',
            message: '# Hello World',
            reacao: 'LIKED',
            onOpenFeedbackDialog: mockOnOpenFeedbackDialog,
            handleAlert: mockHandleAlert
        }

        render(<Actions {...likedProps} />)
        expect(screen.getByLabelText('Gostei')).toHaveClass('liked__button-selecionado')
    })

    test('shows correct icons based on feedback state dislike', () => {
        const feedbackLikedMock: IFeedback = {
            chat_id: '1',
            cod_mensagem: '123',
            conteudo: 'teste',
            inveridico: false,
            nao_ajudou: false,
            ofensivo: false,
            reacao: 'LIKED'
        }

        const likedProps = {
            ...props,
            feedback: feedbackLikedMock,
            cod_message: '123',
            message: '# Hello World',
            reacao: 'DISLIKED',
            onOpenFeedbackDialog: mockOnOpenFeedbackDialog,
            handleAlert: mockHandleAlert
        }

        render(<Actions {...likedProps} />)
        expect(screen.getByLabelText('Não Gostei')).toHaveClass('disliked__button-selecionado')
    })

    test('does not show like/dislike buttons if feedback is present', () => {
        const feedbackLikedMock: IFeedback = {
            chat_id: '1',
            cod_mensagem: '123',
            conteudo: 'teste',
            inveridico: false,
            nao_ajudou: false,
            ofensivo: false,
            reacao: 'LIKED'
        }
        const likedProps = {
            ...props,
            feedback: feedbackLikedMock,
            cod_message: '123',
            message: '# Hello World',
            reacao: 'LIKED',
            onOpenFeedbackDialog: mockOnOpenFeedbackDialog,
            handleAlert: mockHandleAlert
        }

        render(<Actions {...likedProps} />)
        expect(screen.queryByLabelText('Gostei')).not.toBeNull()
        expect(screen.queryByLabelText('Não Gostei')).not.toBeNull()
    })

    test('toast disappears after timeout', async () => {
        // Mock para o clipboard
        const clipboardWriteTextMock = jest.fn().mockResolvedValue('')
        Object.assign(navigator, {
            clipboard: {
                writeText: clipboardWriteTextMock
            }
        })

        render(<Actions {...props} />)

        const copyButton = screen.getByLabelText('Copiar')
        fireEvent.click(copyButton)

        await waitFor(() => {
            expect(removeMd).toHaveBeenCalledWith('# Hello World')
            expect(clipboardWriteTextMock).toHaveBeenCalledWith('Hello World')
        })

        jest.runAllTimers()

        jest.advanceTimersByTime(5000)

        expect(screen.queryByTestId('message-toast')).toBeNull()
    })
})
