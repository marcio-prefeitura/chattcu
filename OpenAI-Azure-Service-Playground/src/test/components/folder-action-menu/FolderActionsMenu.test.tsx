import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FolderActionsMenu from '../../../components/folder-actions-menu/FolderActionsMenu'
import * as AlertUtils from '../../../utils/AlertUtils'

jest.mock('../../../utils/AlertUtils', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock dos componentes modais
jest.mock(
    '../../../components/edit-folder-modal/EditFolderModal',
    () =>
        ({ openModalEditFolder }) =>
            openModalEditFolder ? <div>Mock EditFolderModal</div> : null
)
jest.mock(
    '../../../components/delete-folder-modal/DeleteFolderModel',
    () =>
        ({ openModalDeleteFolder }) =>
            openModalDeleteFolder ? <div>Mock DeleteFolderModal</div> : null
)
jest.mock(
    '../../../components/delete-selected-files-modal/DeleteSelectedFilesModal',
    () =>
        ({ openModalDeleteFile }) =>
            openModalDeleteFile ? <div>Mock DeleteSelectedFilesModal</div> : null
)
jest.mock(
    '../../../components/copy-file-modal/CopyFileModal',
    () =>
        ({ openModalCopyFile }) =>
            openModalCopyFile ? <div>Mock CopyFileModal</div> : null
)
jest.mock(
    '../../../components/move-file-modal/MoveFileModal',
    () =>
        ({ openModalMoveFile }) =>
            openModalMoveFile ? <div>Mock MoveFileModal</div> : null
)

describe('FolderActionsMenu', () => {
    const mockFolder = {
        id: 'id',
        nome: 'Pasta Teste',
        arquivos: [
            { id: 'arquivo1', selected: true },
            { id: 'arquivo2', selected: false }
        ]
    }
    const mockHandleEditFolder = jest.fn()
    const mockHandleDeleteFolder = jest.fn()
    const mockHandleDownloadFolder = jest.fn()
    const mockHandleCopiedFile = jest.fn()
    const mockHandleMovedFileBulk = jest.fn()
    const mockHandleDeleteFiles = jest.fn()
    const mockHandleAlert = jest.fn()
    const mockAlert = { severity: 'info', show: false, msg: '', duration: 0, onClose: jest.fn() }

    const renderComponent = (props = {}) => {
        return render(
            <FolderActionsMenu
                folder={mockFolder}
                filteredFolder={[{}, {}]}
                handleEditFolder={mockHandleEditFolder}
                handleDeleteFolder={mockHandleDeleteFolder}
                handleDownloadFolder={mockHandleDownloadFolder}
                handleCopiedFile={mockHandleCopiedFile}
                handleMovedFileBulk={mockHandleMovedFileBulk}
                handleDeleteFiles={mockHandleDeleteFiles}
                {...props}
            />
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(AlertUtils.default as jest.Mock).mockReturnValue({
            alert: mockAlert,
            handleAlert: mockHandleAlert
        })
    })

    it('deve renderizar o botão de menu', () => {
        renderComponent()
        expect(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`)).toBeInTheDocument()
    })

    it('deve abrir o menu ao clicar no botão', () => {
        renderComponent()
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('deve abrir o modal de edição ao clicar em "Renomear"', async () => {
        renderComponent()
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        fireEvent.click(screen.getByText('Renomear'))
        await waitFor(() => {
            expect(screen.getByText('Mock EditFolderModal')).toBeInTheDocument()
        })
    })

    it('deve abrir o modal de exclusão ao clicar em "Excluir pasta"', async () => {
        renderComponent()
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        fireEvent.click(screen.getByText('Excluir pasta'))
        await waitFor(() => {
            expect(screen.getByText('Mock DeleteFolderModal')).toBeInTheDocument()
        })
    })

    it('deve chamar handleDownloadFolder ao clicar em "Download"', () => {
        renderComponent()
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        fireEvent.click(screen.getByText('Baixar'))
        expect(mockHandleDownloadFolder).toHaveBeenCalledWith(mockFolder)
    })

    it('deve abrir o modal de exclusão de arquivos selecionados', async () => {
        renderComponent()
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        fireEvent.click(screen.getByText('Excluir selecionados'))
        await waitFor(() => {
            expect(screen.getByText('Mock DeleteSelectedFilesModal')).toBeInTheDocument()
        })
    })

    it('deve abrir o modal de cópia de arquivos selecionados', async () => {
        renderComponent()
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        fireEvent.click(screen.getByText('Copiar selecionados'))
        await waitFor(() => {
            expect(screen.getByText('Mock CopyFileModal')).toBeInTheDocument()
        })
    })

    it('deve abrir o modal de movimentação de arquivos selecionados', async () => {
        renderComponent()
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        fireEvent.click(screen.getByText('Mover selecionados'))
        await waitFor(() => {
            expect(screen.getByText('Mock MoveFileModal')).toBeInTheDocument()
        })
    })

    it('não deve mostrar opções de copiar e mover quando há apenas uma pasta', () => {
        renderComponent({ filteredFolder: [{}] })
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${mockFolder.id}`))
        expect(screen.queryByText('Copiar selecionados')).not.toBeInTheDocument()
        expect(screen.queryByText('Mover selecionados')).not.toBeInTheDocument()
    })

    it('deve mostrar mensagem quando a pasta "Arquivos Gerais" está vazia', () => {
        const emptyGeneralFolder = { ...mockFolder, nome: 'Arquivos gerais', arquivos: [] }
        renderComponent({ folder: emptyGeneralFolder })
        fireEvent.click(screen.getByTestId(`folder-action-menu-3-dots-${emptyGeneralFolder.id}`))
        expect(screen.getByText('A pasta Arquivos gerais está vazia')).toBeInTheDocument()
    })
})
