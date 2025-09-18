import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { AlertDialog } from '../../../components/alert-dialog/AlertDialog'

describe('AlertDialog', () => {
    const handleOpenModal = jest.fn()
    const onConfirmation = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders correctly when openModalDeleteFile is true', () => {
        render(
            <AlertDialog
                openModalDeleteFile={true}
                handleOpenModal={handleOpenModal}
                onConfirmation={onConfirmation}
            />
        )

        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Confirma a exclusão do Arquivo?')).toBeInTheDocument()
        expect(
            screen.getByText(
                'Após a exclusão do arquivo não será mais possível sua utilização nas consultas dentro do chat.'
            )
        ).toBeInTheDocument()
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
        expect(screen.getByText('Confirmar')).toBeInTheDocument()
    })

    test('does not render when openModalDeleteFile is false', () => {
        render(
            <AlertDialog
                openModalDeleteFile={false}
                handleOpenModal={handleOpenModal}
                onConfirmation={onConfirmation}
            />
        )

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('calls handleOpenModal with false when cancel button is clicked', () => {
        render(
            <AlertDialog
                openModalDeleteFile={true}
                handleOpenModal={handleOpenModal}
                onConfirmation={onConfirmation}
            />
        )

        fireEvent.click(screen.getByText('Cancelar'))
        expect(handleOpenModal).toHaveBeenCalledWith(false)
    })

    test('calls onConfirmation when confirm button is clicked', () => {
        render(
            <AlertDialog
                openModalDeleteFile={true}
                handleOpenModal={handleOpenModal}
                onConfirmation={onConfirmation}
            />
        )

        fireEvent.click(screen.getByText('Confirmar'))
        expect(onConfirmation).toHaveBeenCalled()
    })

    test('calls handleOpenModal with false when dialog is closed', () => {
        render(
            <AlertDialog
                openModalDeleteFile={true}
                handleOpenModal={handleOpenModal}
                onConfirmation={onConfirmation}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
        expect(handleOpenModal).toHaveBeenCalledWith(false)
    })
})
