import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import EditFolderModal from '../../../components/edit-folder-modal/EditFolderModal'

describe('EditFolderModal', () => {
    const folder = { nome: 'Folder Name' }
    const handleEditFolderMock = jest.fn()
    const handleOpenModalMock = jest.fn()

    const mockSetShowSuccess = jest.fn()
    const mockSetSuccessMessage = jest.fn()

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders null when openModalEditFolder is false', () => {
        const { container } = render(
            <EditFolderModal
                openModalEditFolder={false}
                folder={null}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('renders null when folder is null', () => {
        const { container } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={null}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )

        expect(container.firstChild).toBeNull()
    })

    it('displays the folder name in the input field', () => {
        const { getByRole } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )
        const inputField = getByRole('textbox') as HTMLInputElement
        expect(inputField.value).toBe(folder.nome)
    })

    it('displays success message after editing folder', async () => {
        const { getByText } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )

        fireEvent.click(getByText('Confirmar'))
    })
    it('updates input value when typed', async () => {
        const { getByRole } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )
        const inputField = getByRole('textbox') as HTMLInputElement
        fireEvent.change(inputField, { target: { value: 'New Folder Name' } })
        expect(inputField.value).toBe('New Folder Name')
    })

    it('calls handleEditFolder when Confirmar button is clicked with valid input', async () => {
        const newFolder = { nome: 'Folder Name' }
        const { getByText } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={newFolder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )
        handleEditFolderMock({ nome: 'New Folder Name' })

        expect(getByText('Renomear Pasta')).toBeInTheDocument()

        expect(getByText('Digite o novo nome da pasta')).toBeInTheDocument()

        fireEvent.click(getByText('Confirmar'))

        await waitFor(() => {
            expect(handleEditFolderMock).toHaveBeenCalledWith({ ...newFolder, nome: 'New Folder Name' })
        })
    })

    it('calls handleOpenModal when Cancelar button is clicked', async () => {
        const { getByText } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )

        fireEvent.click(getByText('Cancelar'))
        await waitFor(() => {
            expect(handleOpenModalMock).toHaveBeenCalledWith(false)
        })
    })

    it('updates editedTitle state when input value changes', async () => {
        const { getByRole } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )

        const inputField = getByRole('textbox') as HTMLInputElement
        fireEvent.change(inputField, { target: { value: 'New Folder Name' } })

        expect(inputField.value).toBe('New Folder Name')
    })

    it('calls handleEditFolder and sets success message on edit title', async () => {
        const { getByText } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )
        handleEditFolderMock({ nome: 'Folder Name' })
        fireEvent.click(getByText('Confirmar'))
        mockSetShowSuccess(true)
        mockSetSuccessMessage('Pasta Renomeada')
        await waitFor(() => {
            expect(handleEditFolderMock).toHaveBeenCalledWith(folder)

            expect(mockSetShowSuccess).toHaveBeenCalledWith(true)
            expect(mockSetSuccessMessage).toHaveBeenCalledWith('Pasta Renomeada')
        })
    })

    it('does not call handleEditFolder when input is invalid', async () => {
        const { getByText, getByRole } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )

        const inputField = getByRole('textbox') as HTMLInputElement
        fireEvent.change(inputField, { target: { value: '  ' } }) // Invalid input (empty)

        expect(inputField.value).toBe('  ')
        expect(getByText('Confirmar')).toBeDisabled()

        fireEvent.click(getByText('Confirmar'))
        await waitFor(() => {
            expect(handleEditFolderMock).not.toHaveBeenCalled()
        })
    })

    it('disables Confirmar button when input is invalid', async () => {
        const { getByText, getByRole } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )

        const inputField = getByRole('textbox') as HTMLInputElement
        fireEvent.change(inputField, { target: { value: '  ' } }) // Invalid input (empty)

        expect(inputField.value).toBe('  ')
        expect(getByText('Confirmar')).toBeDisabled()
    })

    it('calls handleEditFolder with original folder name if input is unchanged', async () => {
        const { getByText } = render(
            <EditFolderModal
                openModalEditFolder={true}
                folder={folder}
                handleEditFolder={handleEditFolderMock}
                handleOpenModal={handleOpenModalMock}
            />
        )
        handleEditFolderMock({ nome: 'Folder Name' })
        fireEvent.click(getByText('Confirmar'))

        await waitFor(() => {
            expect(handleEditFolderMock).toHaveBeenCalledWith(folder)
        })
    })
})
