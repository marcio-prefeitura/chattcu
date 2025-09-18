import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeleteFileModel from '../../../components/delete-file-modal/DeleteFileModel'

const mockHandleOpenModal = jest.fn()
const mockHandleDeleteFile = jest.fn()

describe('DeleteFileModel', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render modal when openModalDeleteFile is true and file is not null', () => {
        const file = { id: '123', nome: 'Test Document' }

        render(
            <DeleteFileModel
                openModalDeleteFile={true}
                file={file}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        expect(screen.getByText('Excluir documento')).toBeInTheDocument()
    })

    it('should not render modal when file is null', () => {
        render(
            <DeleteFileModel
                openModalDeleteFile={true}
                file={null}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        expect(screen.queryByText('Excluir documento')).not.toBeInTheDocument()
    })

    it('should call handleDeleteFile with correct file.id when "Confirmar" is clicked', async () => {
        const file = { id: '123', nome: 'Test Document' }

        render(
            <DeleteFileModel
                openModalDeleteFile={true}
                file={file}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        fireEvent.click(screen.getByText('Confirmar'))

        await waitFor(() => expect(mockHandleDeleteFile).toHaveBeenCalledWith('123'))
    })

    it('should call handleOpenModal with false when "Cancelar" button is clicked', async () => {
        const file = { id: '123', nome: 'Test Document' }

        render(
            <DeleteFileModel
                openModalDeleteFile={true}
                file={file}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        fireEvent.click(screen.getByText('Cancelar'))

        await waitFor(() => expect(mockHandleOpenModal).toHaveBeenCalledWith(false))
    })

    it('should call handleOpenModal when close icon is clicked', async () => {
        const file = { id: '123', nome: 'Test Document' }

        render(
            <DeleteFileModel
                openModalDeleteFile={true}
                file={file}
                handleOpenModal={mockHandleOpenModal}
                handleDeleteFile={mockHandleDeleteFile}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: '' }))

        await waitFor(() => expect(mockHandleOpenModal).toHaveBeenCalledWith(false))
    })
})
