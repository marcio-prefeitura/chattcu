import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DeleteSelectedFilesModal from '../../../components/delete-selected-files-modal/DeleteSelectedFilesModal' // Adjust the import path as necessary
import '@testing-library/jest-dom'

const mockHandleDeleteFile = jest.fn()
const mockHandleOpenModal = jest.fn()

const folderMock = { id: '1', name: 'Test Folder' }

describe('DeleteSelectedFilesModal', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render modal when openModalDeleteFile is true', () => {
        render(
            <DeleteSelectedFilesModal
                openModalDeleteFile={true}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        expect(screen.getByText('Excluir documentos selecionados')).toBeInTheDocument()
        expect(screen.getByText('Deseja excluir os documentos selecionados?')).toBeInTheDocument()
    })

    it('should not render modal when openModalDeleteFile is false', () => {
        render(
            <DeleteSelectedFilesModal
                openModalDeleteFile={false}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        expect(screen.queryByText('Excluir documentos selecionados')).not.toBeInTheDocument()
    })

    it('should not render modal when folder is null', () => {
        render(
            <DeleteSelectedFilesModal
                openModalDeleteFile={true}
                folder={null}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        expect(screen.queryByText('Excluir documentos selecionados')).not.toBeInTheDocument()
    })

    it('should call handleClose when Cancel button is clicked', () => {
        render(
            <DeleteSelectedFilesModal
                openModalDeleteFile={true}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        const cancelButton = screen.getByText('Cancelar')
        fireEvent.click(cancelButton)

        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })

    it('should call handleDeleteFile with the folder when Confirm button is clicked', async () => {
        render(
            <DeleteSelectedFilesModal
                openModalDeleteFile={true}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        const confirmButton = screen.getByText('Confirmar')
        fireEvent.click(confirmButton)

        expect(mockHandleDeleteFile).toHaveBeenCalledWith(folderMock)
    })
})
