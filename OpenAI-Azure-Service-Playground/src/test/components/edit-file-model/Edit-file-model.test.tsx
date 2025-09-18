import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import EditFileModal from '../../../components/edit-file-modal/EditFileModal'

describe('EditFileModal', () => {
    const handleOpenModal = jest.fn()
    const handleEditFile = jest.fn()

    const file = {
        nome: 'test.txt'
    }

    beforeEach(() => {
        handleOpenModal.mockClear()
        handleEditFile.mockClear()
    })

    it('should render the modal when openModalEditFile is true', () => {
        const { getByText } = render(
            <EditFileModal
                openModalEditFile={true}
                file={file}
                handleOpenModal={handleOpenModal}
                handleEditFile={handleEditFile}
            />
        )

        expect(getByText('Renomear Documento')).toBeInTheDocument()
        expect(getByText('Digite o novo nome do documento')).toBeInTheDocument()
    })

    it('should not render the modal when openModalEditFile is false', () => {
        const { queryByText } = render(
            <EditFileModal
                openModalEditFile={false}
                file={file}
                handleOpenModal={handleOpenModal}
                handleEditFile={handleEditFile}
            />
        )

        expect(queryByText('Renomear Documento')).toBeNull()
        expect(queryByText('Digite o novo nome do documento')).toBeNull()
    })

    it('should call handleOpenModal with false when the close button is clicked', () => {
        const { getByRole } = render(
            <EditFileModal
                openModalEditFile={true}
                file={file}
                handleOpenModal={handleOpenModal}
                handleEditFile={handleEditFile}
            />
        )

        fireEvent.click(getByRole('button', { name: '' }))

        expect(handleOpenModal).toHaveBeenCalledWith(false)
    })

    it('should update the editedTitle state when the text field value changes', () => {
        const { getByRole } = render(
            <EditFileModal
                openModalEditFile={true}
                file={file}
                handleOpenModal={handleOpenModal}
                handleEditFile={handleEditFile}
            />
        )

        const textField = getByRole('textbox') as HTMLInputElement
        fireEvent.change(textField, { target: { value: 'newTitle' } })

        expect(textField.value).toBe('newTitle')
    })

    it('should call handleEditFile and handleClose when the confirm button is clicked with a valid title', async () => {
        const { getByRole } = render(
            <EditFileModal
                openModalEditFile={true}
                file={file}
                handleOpenModal={handleOpenModal}
                handleEditFile={handleEditFile.mockReturnValue(true)}
            />
        )

        const textField = getByRole('textbox')
        fireEvent.change(textField, { target: { value: 'newTitle' } })

        const confirmButton = getByRole('button', { name: 'Confirmar' })
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(handleEditFile).toHaveBeenCalledWith({ ...file, nome: 'newTitle' })
            expect(handleOpenModal).toHaveBeenCalledWith(false)
        })
    })

    it('should not call handleEditFile and handleClose when the confirm button is clicked with an invalid title', () => {
        const { getByRole } = render(
            <EditFileModal
                openModalEditFile={true}
                file={file}
                handleOpenModal={handleOpenModal}
                handleEditFile={handleEditFile}
            />
        )

        const textField = getByRole('textbox')
        fireEvent.change(textField, { target: { value: '' } })

        const confirmButton = getByRole('button', { name: 'Confirmar' })
        fireEvent.click(confirmButton)

        expect(handleEditFile).not.toHaveBeenCalled()
        expect(handleOpenModal).not.toHaveBeenCalled()
    })

    // it('should show the success message when showSuccess is true', () => {
    //     const { getByText } = render(
    //         <EditFileModal
    //             openModalEditFile={true}
    //             file={file}
    //             handleOpenModal={handleOpenModal}
    //             handleEditFile={handleEditFile}
    //         />
    //     )
    //
    //     expect(getByText('Documento Renomeado')).toBeInTheDocument()
    // })

    it('should hide the success message when showSuccess is false', () => {
        const { queryByText } = render(
            <EditFileModal
                openModalEditFile={true}
                file={file}
                handleOpenModal={handleOpenModal}
                handleEditFile={handleEditFile}
            />
        )

        expect(queryByText('Documento Renomeado')).toBeNull()
    })
})
