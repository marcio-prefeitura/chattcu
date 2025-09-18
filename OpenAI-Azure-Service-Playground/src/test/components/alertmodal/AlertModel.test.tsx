import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { AlertModal } from '../../../components/alert-modal/AlertModal'

describe('<AlertModal/>', () => {
    const defaultProps = {
        title: 'Test Title',
        message: 'Test Message',
        messageOk: 'OK',
        openModal: true,
        showCancelButton: true,
        onConfirmation: jest.fn()
    }

    it('should render the modal with title, message and buttons', () => {
        render(<AlertModal {...defaultProps} />)

        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test Message')).toBeInTheDocument()
        expect(screen.getByText('OK')).toBeInTheDocument()
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('should call onConfirmation with false when cancel button is clicked', () => {
        render(<AlertModal {...defaultProps} />)
        fireEvent.click(screen.getByText('Cancelar'))
        expect(defaultProps.onConfirmation).toHaveBeenCalledWith(false)
    })

    it('should call onConfirmation with true when OK button is clicked', () => {
        render(<AlertModal {...defaultProps} />)
        fireEvent.click(screen.getByText('OK'))
        expect(defaultProps.onConfirmation).toHaveBeenCalledWith(true)
    })

    it('should call onConfirmation with false when close icon button is clicked', () => {
        render(<AlertModal {...defaultProps} />)
        fireEvent.click(screen.getByLabelText('Fechar'))
        expect(defaultProps.onConfirmation).toHaveBeenCalledWith(false)
    })

    it('should not render cancel button if showCancelButton is false', () => {
        render(
            <AlertModal
                {...defaultProps}
                showCancelButton={false}
            />
        )
        expect(screen.queryByText('Cancelar')).toBeNull()
    })

    it('should not render the modal when openModal is false', () => {
        render(
            <AlertModal
                {...defaultProps}
                openModal={false}
            />
        )
        expect(screen.queryByRole('dialog')).toBeNull()
    })
})
