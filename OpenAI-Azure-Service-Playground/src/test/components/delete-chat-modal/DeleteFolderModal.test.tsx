import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DeleteFolderModel from '../../../components/delete-folder-modal/DeleteFolderModel' // Adjust the import path as necessary
import '@testing-library/jest-dom'

const mockHandleDeleteFolder = jest.fn()
const mockHandleOpenModal = jest.fn()

const folderMock = { id: '1', nome: 'Test Folder' }

describe('DeleteFolderModel', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render modal when openModalDeleteFolder is true', () => {
        render(
            <DeleteFolderModel
                openModalDeleteFolder={true}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFolder={mockHandleDeleteFolder}
            />
        )

        expect(screen.getByText('Excluir pasta')).toBeInTheDocument()
    })

    it('should not render modal when openModalDeleteFolder is false', () => {
        render(
            <DeleteFolderModel
                openModalDeleteFolder={false}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFolder={mockHandleDeleteFolder}
            />
        )

        expect(screen.queryByText('Excluir pasta')).not.toBeInTheDocument()
    })

    it('should call handleClose when Cancel button is clicked', () => {
        render(
            <DeleteFolderModel
                openModalDeleteFolder={true}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFolder={mockHandleDeleteFolder}
            />
        )

        const cancelButton = screen.getByText('Cancelar')
        fireEvent.click(cancelButton)

        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })

    it('should call handleDeleteFolder with the folder id when Confirm button is clicked', async () => {
        render(
            <DeleteFolderModel
                openModalDeleteFolder={true}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFolder={mockHandleDeleteFolder}
            />
        )

        const confirmButton = screen.getByText('Confirmar')
        fireEvent.click(confirmButton)

        expect(mockHandleDeleteFolder).toHaveBeenCalledWith(folderMock.id)
    })

    it('should call handleDeleteFolder with the folder id when Enter key is pressed', async () => {
        render(
            <DeleteFolderModel
                openModalDeleteFolder={true}
                folder={folderMock}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFolder={mockHandleDeleteFolder}
            />
        )

        fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' })

        expect(mockHandleDeleteFolder).toHaveBeenCalledWith(folderMock.id)
    })
})
