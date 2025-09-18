import { renderHook, act } from '@testing-library/react'
import { useFolder } from '../../hooks/useFolder'
import { IFile, IFolder } from '../../shared/interfaces/Folder'
import { useFileCopy } from '../../hooks/useFileCopy'

jest.mock('../../hooks/useFolder', () => ({
    useFolder: jest.fn()
}))

describe('useFileCopy', () => {
    const mockOrganizeFolders = jest.fn()
    const mockUpdateFolders = jest.fn()
    const mockCopyFileToFolder = jest.fn()
    const mockUnselectAllFiles = jest.fn()
    const mockHandleMessageSuccess = jest.fn()
    const mockSetUploadedFiles = jest.fn()
    const mockOnUploadedFilesChange = jest.fn()
    const mockUpdateChips = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        ;(useFolder as jest.Mock).mockReturnValue({
            organizeFolders: mockOrganizeFolders,
            updateFolders: mockUpdateFolders
        })
    })

    it('should copy file to folder and update state', async () => {
        const uploadedFilesMock: IFolder[] = [
            {
                id: '1',
                nome: 'Folder 1',
                arquivos: [],
                open: true,
                selected: false,
                usuario: '',
                st_removido: false,
                id_pasta_pai: '',
                data_criacao: undefined,
                st_arquivo: false,
                tamanho: '',
                tipo_midia: '',
                nome_blob: '',
                status: ''
            }
        ]

        const copiedFileMock: IFile = {
            id: 'file1',
            id_pasta_pai: '1',
            nome: 'File 1',
            usuario: '',
            st_removido: false,
            data_criacao: undefined,
            st_arquivo: false,
            tamanho: '',
            tipo_midia: '',
            nome_blob: '',
            status: '',
            selected: true,
            progress: 0
        }

        const oldFolderMock: IFolder = {
            id: '1',
            nome: 'Folder 1',
            arquivos: [copiedFileMock],
            open: true,
            selected: true,
            usuario: '',
            st_removido: false,
            id_pasta_pai: '',
            data_criacao: undefined,
            st_arquivo: false,
            tamanho: '',
            tipo_midia: '',
            nome_blob: '',
            status: ''
        }

        const mensagemMock = 'File copied successfully!'

        mockCopyFileToFolder.mockReturnValue(uploadedFilesMock)
        mockUnselectAllFiles.mockReturnValue(oldFolderMock)
        mockUpdateFolders.mockReturnValue(uploadedFilesMock)
        mockOrganizeFolders.mockReturnValue(uploadedFilesMock)

        const { result } = renderHook(() =>
            useFileCopy({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles: mockSetUploadedFiles,
                onUploadedFilesChange: mockOnUploadedFilesChange,
                handleMessageSuccess: mockHandleMessageSuccess,
                copyFileToFolder: mockCopyFileToFolder,
                unselectAllFiles: mockUnselectAllFiles,
                updateChips: mockUpdateChips
            })
        )

        await act(async () => {
            result.current.handleCopiedFile([copiedFileMock], oldFolderMock, mensagemMock)
        })

        expect(mockCopyFileToFolder).toHaveBeenCalledWith(uploadedFilesMock, copiedFileMock)
        expect(mockUnselectAllFiles).toHaveBeenCalledWith(oldFolderMock)
        expect(mockUpdateFolders).toHaveBeenCalledWith(uploadedFilesMock, oldFolderMock)
        expect(mockOrganizeFolders).toHaveBeenCalledWith(uploadedFilesMock)
        expect(mockHandleMessageSuccess).toHaveBeenCalledWith(mensagemMock, true)
        expect(mockSetUploadedFiles).toHaveBeenCalledWith(uploadedFilesMock)
        expect(mockOnUploadedFilesChange).toHaveBeenCalledWith(uploadedFilesMock)
        expect(mockUpdateChips).toHaveBeenCalledWith(uploadedFilesMock)
    })

    it('should not copy files if copiedFiles is empty', async () => {
        const uploadedFilesMock: IFolder[] = [
            {
                id: '1',
                nome: 'Folder 1',
                arquivos: [],
                open: true,
                selected: false,
                usuario: '',
                st_removido: false,
                id_pasta_pai: '',
                data_criacao: undefined,
                st_arquivo: false,
                tamanho: '',
                tipo_midia: '',
                nome_blob: '',
                status: ''
            }
        ]

        const oldFolderMock: IFolder = {
            id: '1',
            nome: 'Folder 1',
            arquivos: [],
            open: true,
            selected: true,
            usuario: '',
            st_removido: false,
            id_pasta_pai: '',
            data_criacao: undefined,
            st_arquivo: false,
            tamanho: '',
            tipo_midia: '',
            nome_blob: '',
            status: ''
        }

        const mensagemMock = 'No files to copy'

        const { result } = renderHook(() =>
            useFileCopy({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles: mockSetUploadedFiles,
                onUploadedFilesChange: mockOnUploadedFilesChange,
                handleMessageSuccess: mockHandleMessageSuccess,
                copyFileToFolder: mockCopyFileToFolder,
                unselectAllFiles: mockUnselectAllFiles,
                updateChips: mockUpdateChips
            })
        )

        await act(async () => {
            result.current.handleCopiedFile([], oldFolderMock, mensagemMock)
        })

        expect(mockCopyFileToFolder).not.toHaveBeenCalled()
        expect(mockUnselectAllFiles).not.toHaveBeenCalled()
        expect(mockUpdateFolders).not.toHaveBeenCalled()
        expect(mockOrganizeFolders).not.toHaveBeenCalled()
        expect(mockHandleMessageSuccess).not.toHaveBeenCalled()
        expect(mockSetUploadedFiles).not.toHaveBeenCalled()
        expect(mockOnUploadedFilesChange).not.toHaveBeenCalled()
        expect(mockUpdateChips).not.toHaveBeenCalled()
    })
})
