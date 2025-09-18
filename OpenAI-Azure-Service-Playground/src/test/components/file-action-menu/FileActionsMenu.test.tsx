/* eslint-disable @typescript-eslint/no-extra-semi */
import React from 'react'

import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import '@testing-library/jest-dom'
import FileActionsMenu from '../../../components/file-actions-menu/FileActionsMenu'
import { MidiasAceitasEnum, getMidiaByExtensao } from '../../../utils/enum/MidiasAceitasEnum'

// Mocks
jest.mock('../../../utils/AlertUtils', () => ({
    __esModule: true,
    default: () => ({
        alert: null,
        handleAlert: jest.fn()
    })
}))

jest.mock('../../../utils/enum/MidiasAceitasEnum', () => ({
    MidiasAceitasEnum: {
        PDF: { label: 'pdf', icon: 'icon-pdf', extensaoSimplificada: 'pdf' },
        DOCX: {
            label: 'docx',
            icon: 'icon-doc-word',
            extensaoSimplificada: 'vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        XLSX: {
            label: 'xlsx',
            icon: 'icon-xls-excel',
            extensaoSimplificada: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        LINK: { label: 'link', icon: 'icon-link', extensaoSimplificada: '' },
        CSV: { label: 'csv', icon: 'icon-xls-excel', extensaoSimplificada: 'csv' }
    },
    getMidiaByExtensao: jest.fn()
}))

// Mock child components
jest.mock('../../../components/copy-file-modal/CopyFileModal', () => () => <div>Mock CopyFileModal</div>)
jest.mock('../../../components/move-file-modal/MoveFileModal', () => () => <div>Mock MoveFileModal</div>)
jest.mock('../../../components/edit-file-modal/EditFileModal', () => () => <div>Mock EditFileModal</div>)
jest.mock('../../../components/delete-file-modal/DeleteFileModel', () => () => <div>Mock DeleteFileModel</div>)

describe('FileActionsMenu', () => {
    const mockFile = {
        id: 'file1',
        id_pasta_pai: 'folder1',
        tipo_midia: 'pdf'
    }
    const mockFilteredFolder = [{ id: '1' }, { id: '2' }]
    const mockHandleEditFile = jest.fn()
    const mockHandleDeleteFile = jest.fn()
    const mockHandleDownloadFile = jest.fn().mockImplementation(() => Promise.resolve())
    const mockHandleCopiedFile = jest.fn()
    const mockHandleMovedFile = jest.fn()

    const renderComponent = (props = {}) => {
        return render(
            <FileActionsMenu
                file={mockFile}
                filteredFolder={mockFilteredFolder}
                handleEditFile={mockHandleEditFile}
                handleDeleteFile={mockHandleDeleteFile}
                handleDownloadFile={mockHandleDownloadFile}
                handleCopiedFile={mockHandleCopiedFile}
                handleMovedFile={mockHandleMovedFile}
                {...props}
            />
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('deve renderizar o botão do menu', () => {
        renderComponent()
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('deve abrir o menu quando o botão é clicado', () => {
        renderComponent()
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('deve renderizar todos os itens do menu', () => {
        renderComponent()
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByText('Renomear')).toBeInTheDocument()
        expect(screen.getByText('Excluir')).toBeInTheDocument()
        expect(screen.getByText('Baixar')).toBeInTheDocument()
        expect(screen.getByText('Copiar')).toBeInTheDocument()
        expect(screen.getByText('Mover')).toBeInTheDocument()
    })

    it('deve chamar handleEditFile quando Renomear é clicado', () => {
        renderComponent()
        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText('Renomear'))
        expect(screen.getByText('Mock EditFileModal')).toBeInTheDocument()
    })

    it('deve chamar handleDeleteFile quando Excluir é clicado', () => {
        renderComponent()
        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText('Excluir'))
        expect(screen.getByText('Mock DeleteFileModel')).toBeInTheDocument()
    })

    it('deve chamar handleDownloadFile quando Download é clicado', async () => {
        renderComponent()
        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText('Baixar'))

        await waitFor(() => {
            expect(mockHandleDownloadFile).toHaveBeenCalledWith(mockFile)
        })
    })

    // it('deve renderizar submenu de download para arquivos LINK quando o usuário é perfilDev', () => {
    //     ;(getMidiaByExtensao as jest.Mock).mockReturnValue(MidiasAceitasEnum.LINK)
    //     renderComponent({ profile: { perfilDev: true } })
    //     fireEvent.click(screen.getByRole('button'))
    //     expect(screen.getAllByText('Baixar').length).toBe(1)
    // })

    it('não deve renderizar opções Copiar e Mover quando filteredFolder tem tamanho 1', () => {
        renderComponent({ filteredFolder: [{ id: '1' }] })
        fireEvent.click(screen.getByRole('button'))
        expect(screen.queryByText('Copiar')).not.toBeInTheDocument()
        expect(screen.queryByText('Mover')).not.toBeInTheDocument()
    })

    it('deve abrir CopyFileModal quando Copiar é clicado', () => {
        renderComponent()
        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText('Copiar'))
        expect(screen.getByText('Mock CopyFileModal')).toBeInTheDocument()
    })

    it('deve abrir MoveFileModal quando Mover é clicado', () => {
        renderComponent()
        fireEvent.click(screen.getByRole('button'))
        fireEvent.click(screen.getByText('Mover'))
        expect(screen.getByText('Mock MoveFileModal')).toBeInTheDocument()
    })
})
