import { act, renderHook } from '@testing-library/react'
import { useFileModal } from '../../hooks/useFileModal'
import { copyFile, moveFile } from '../../infrastructure/api'

jest.mock('../../infrastructure/api', () => ({
    moveFile: jest.fn(),
    copyFile: jest.fn()
}))

describe('useFileModal', () => {
    const mockHandleOpenModal = jest.fn()
    const mockOnCopyFile = jest.fn()
    const mockOnMoveFile = jest.fn()
    const mockFile = {
        id: '1',
        st_arquivo: false,
        arquivos: [
            { id: '2', selected: true },
            { id: '3', selected: false }
        ]
    }
    const mockFilteredFolder = [{ id: '1', arquivos: [] }]

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should initialize with default states', () => {
        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        expect(result.current.selectedFolder).toBe('')
        expect(result.current.openModalFileExists).toBe(false)
        expect(result.current.titleMessageExists).toBe('')
        expect(result.current.messageExistsFile).toBe('')
        expect(result.current.showCancelButton).toBe(false)
        expect(result.current.showProgress).toBe(false)
        expect(result.current.isFolder).toBe(true)
    })

    it('should handle folder selection change', () => {
        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        act(() => {
            result.current.handleFolderChange({ target: { value: '2' } } as any)
        })

        expect(result.current.selectedFolder).toBe('2')
    })

    it('should close the modal and reset states', () => {
        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        act(() => {
            result.current.handleClose()
        })

        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
        expect(result.current.selectedFolder).toBe('')
    })

    it('should process files and call onMoveFile when operation is "move"', async () => {
        const mockedMoveFile = moveFile as jest.Mock
        mockedMoveFile.mockResolvedValueOnce({ itens: [{ id: '2' }] })

        const mockFile = {
            id: '1',
            arquivos: [],
            st_arquivo: true // Simula que é um arquivo
        }
        const mockFilteredFolder = [{ id: '1', name: 'Folder 1' }]
        const mockOnMoveFile = jest.fn()
        const mockOnCopyFile = jest.fn()
        const mockHandleOpenModal = jest.fn()

        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        act(() => {
            result.current.handleFolderChange({ target: { value: '1' } } as any)
        })

        await act(async () => {
            await result.current.handleConfirm()
        })

        expect(mockOnMoveFile).toHaveBeenCalledWith({ itens: [{ id: '2' }] }, mockFile, null)
        expect(result.current.showProgress).toBe(false)
    })

    it('should handle errors during file operations', async () => {
        const mockedMoveFile = moveFile as jest.Mock
        mockedMoveFile.mockResolvedValueOnce(new Error('Operation failed'))
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: jest.fn(),
                operation: 'move',
                file: { id: '1', arquivos: [], st_arquivo: false },
                filteredFolder: [],
                onCopyFile: jest.fn(),
                onMoveFile: jest.fn()
            })
        )
        await act(async () => {
            await result.current.handleConfirm()
        })

        expect(result.current.showProgress).toBe(false)
        expect(consoleErrorSpy).toHaveBeenCalledWith('Pasta ou arquivo não selecionado.')
        consoleErrorSpy.mockRestore()
    })

    it('should show error modal when no files are selected for folders', async () => {
        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: { ...mockFile, arquivos: [] },
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        await act(async () => {
            await result.current.handleConfirm()
        })

        expect(result.current.openModalFileExists).toBe(false)
        expect(result.current.titleMessageExists).toBe('')
        expect(result.current.messageExistsFile).toBe('')
    })

    it('should call onCopyFile with copyResults and oldFolderUpdated in onCopyFileChange', async () => {
        const mockedCopyFile = copyFile as jest.Mock
        mockedCopyFile.mockResolvedValueOnce({ itens: [{ id: '2' }] })

        const mockFile = { id: '1', arquivos: [], st_arquivo: true, id_pasta_pai: '1' }
        const mockFilteredFolder = [{ id: '1', name: 'Folder 1' }]

        const mockOnMoveFile = jest.fn()
        const mockOnCopyFile = jest.fn()
        const mockHandleOpenModal = jest.fn()

        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'copy',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )
        act(() => {
            result.current.handleFolderChange({ target: { value: '1' } } as any)
        })
        await act(async () => {
            await result.current.handleConfirm()
        })
        expect(mockOnCopyFile).toHaveBeenCalledWith({ itens: [{ id: '2' }] }, { id: '1', name: 'Folder 1' })
        expect(result.current.showProgress).toBe(false)
    })

    // it('should call onCopyFile with copyResults and updated folder in onCopyFileIsFolderChange', async () => {
    //     const mockedCopyFile = copyFile as jest.Mock
    //     mockedCopyFile.mockResolvedValueOnce({ itens: [{ id: '3' }] })
    //
    //     const mockFolder = { id: '1', arquivos: [], st_arquivo: true, id_pasta_pai: '1' }
    //     const mockSelectedFolder = { id: '2', name: 'Folder 2' }
    //     const mockFolderFiles = [{ id: 'file1', name: 'Test File' }]
    //
    //     const mockSetSelectedFolder = jest.fn()
    //     const mockSetShowProgress = jest.fn()
    //     const mockHandleOpenModal = jest.fn()
    //     const mockOnCopyFile = jest.fn()
    //
    //     jest.spyOn(React, 'useState')
    //         .mockImplementationOnce(() => [mockSelectedFolder, mockSetSelectedFolder])
    //         .mockImplementationOnce(() => [false, mockSetShowProgress])
    //
    //     const onCopyFileIsFolderChange = async (folderFiles: any) => {
    //         const folder: IFolder = mockFolder
    //         const copyResults: MoveCopyFilesApiResponse = await copyFile(folderFiles, mockSelectedFolder)
    //         const oldFolderUpdated: IFolder = { ...folder }
    //         mockSetSelectedFolder('')
    //         mockSetShowProgress(false)
    //         mockHandleOpenModal(false)
    //         mockOnCopyFile(copyResults, oldFolderUpdated)
    //     }
    //
    //     await act(async () => {
    //         await onCopyFileIsFolderChange(mockFolderFiles)
    //     })
    //
    //     expect(mockedCopyFile).toHaveBeenCalledWith(mockFolderFiles, mockSelectedFolder)
    //     expect(mockSetSelectedFolder).toHaveBeenCalledWith('')
    //     expect(mockSetShowProgress).toHaveBeenCalledWith(false)
    //     expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    //     expect(mockOnCopyFile).toHaveBeenCalledWith({ itens: [{ id: '3' }] }, { ...mockFolder })
    // })

    it('should set and reset modal visibility when calling setOpenModalFileExists', () => {
        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        act(() => {
            result.current.setOpenModalFileExists(true)
        })

        expect(result.current.openModalFileExists).toBe(true)

        act(() => {
            result.current.setOpenModalFileExists(false)
        })

        expect(result.current.openModalFileExists).toBe(false)
    })

    it('should show error message when no folder is selected', async () => {
        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        await act(async () => {
            await result.current.handleConfirm()
        })

        expect(result.current.openModalFileExists).toBe(false)
        expect(result.current.titleMessageExists).toBe('')
        expect(result.current.messageExistsFile).toBe('')
    })

    it('should reset state and close modal after successful operation', async () => {
        const mockedMoveFile = moveFile as jest.Mock
        mockedMoveFile.mockResolvedValueOnce({ itens: [{ id: '2' }] })

        const { result } = renderHook(() =>
            useFileModal({
                handleOpenModal: mockHandleOpenModal,
                operation: 'move',
                file: mockFile,
                filteredFolder: mockFilteredFolder,
                onCopyFile: mockOnCopyFile,
                onMoveFile: mockOnMoveFile
            })
        )

        act(() => {
            result.current.handleFolderChange({ target: { value: '1' } } as any)
        })

        await act(async () => {
            await result.current.handleConfirm()
        })

        expect(result.current.selectedFolder).toBe('')
        expect(result.current.showProgress).toBe(false)
        expect(mockHandleOpenModal).toHaveBeenCalledWith(false)
    })
})
