import { act, renderHook } from '@testing-library/react'
import { useFileDeletion } from '../../hooks/useFileDeletion'

const mockFunctions = {
    getFilesId: jest.fn(),
    removeFolderFiles: jest.fn(),
    getSelectedFolderFiles: jest.fn(),
    updateFolders: jest.fn(),
    organizeFolders: jest.fn(),
    getFolder: jest.fn(),
    removeFileFromFolder: jest.fn(),
    mutateAsync: jest.fn(),
    updateChips: jest.fn()
}

jest.mock('../../hooks/useFile', () => ({
    useFile: () => ({
        getFilesId: mockFunctions.getFilesId,
        removeFolderFiles: mockFunctions.removeFolderFiles,
        getSelectedFolderFiles: mockFunctions.getSelectedFolderFiles,
        removeFileFromFolder: mockFunctions.removeFileFromFolder
    })
}))

jest.mock('../../hooks/useFolder', () => ({
    useFolder: () => ({
        updateFolders: mockFunctions.updateFolders,
        organizeFolders: mockFunctions.organizeFolders,
        getFolder: mockFunctions.getFolder
    })
}))

describe('useFileDeletion', () => {
    let uploadedFilesMock
    let setUploadedFilesMock
    let onUploadedFilesChangeMock

    beforeEach(() => {
        uploadedFilesMock = [
            {
                id: '1',
                name: 'Folder 1',
                open: true,
                selected: true,
                arquivos: [{ id: 'file1', selected: true }]
            }
        ]
        setUploadedFilesMock = jest.fn()
        onUploadedFilesChangeMock = jest.fn()
        Object.values(mockFunctions).forEach(fn => fn.mockReset())
    })

    const setupHook = (overrides = {}) =>
        renderHook(() =>
            useFileDeletion({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles: setUploadedFilesMock,
                onUploadedFilesChange: onUploadedFilesChangeMock,
                mutateDeleteFile: { mutateAsync: mockFunctions.mutateAsync },
                mutateDeleteFiles: { mutateAsync: mockFunctions.mutateAsync },
                updateChips: mockFunctions.updateChips,
                ...overrides
            })
        )

    it('should handle successful deletion', async () => {
        mockFunctions.getSelectedFolderFiles.mockReturnValue([{ id: 'file1', selected: true }])
        mockFunctions.getFilesId.mockReturnValue(['file1'])
        mockFunctions.removeFolderFiles.mockReturnValue({
            id: '1',
            name: 'Folder 1',
            open: false,
            selected: false,
            arquivos: []
        })
        mockFunctions.updateFolders.mockReturnValue(uploadedFilesMock)
        mockFunctions.mutateAsync.mockResolvedValue(true)

        const { result } = setupHook()

        await act(async () => {
            await result.current.handleDeleteFiles(uploadedFilesMock[0])
        })

        expect(mockFunctions.getSelectedFolderFiles).toHaveBeenCalledWith(uploadedFilesMock[0])
        expect(mockFunctions.getFilesId).toHaveBeenCalledWith([{ id: 'file1', selected: true }])
        expect(mockFunctions.mutateAsync).toHaveBeenCalledWith(['file1'])
        expect(mockFunctions.organizeFolders).toHaveBeenCalledWith(uploadedFilesMock)
        expect(setUploadedFilesMock).toHaveBeenCalled()
        expect(mockFunctions.updateChips).toHaveBeenCalledWith(uploadedFilesMock)
        expect(onUploadedFilesChangeMock).toHaveBeenCalledWith(uploadedFilesMock)
    })

    it('should not proceed if no files are selected', async () => {
        mockFunctions.getSelectedFolderFiles.mockReturnValue([])

        const { result } = setupHook()

        await act(async () => {
            await result.current.handleDeleteFiles(uploadedFilesMock[0])
        })

        expect(mockFunctions.getSelectedFolderFiles).toHaveBeenCalledWith(uploadedFilesMock[0])
        expect(mockFunctions.getFilesId).not.toHaveBeenCalled()
        expect(mockFunctions.mutateAsync).not.toHaveBeenCalled()
        expect(setUploadedFilesMock).not.toHaveBeenCalled()
        expect(mockFunctions.updateChips).not.toHaveBeenCalled()
    })

    it('should successfully delete a file and update states', async () => {
        const mockFolderSelected = uploadedFilesMock[0]
        const updatedFolder = {
            ...mockFolderSelected,
            arquivos: mockFolderSelected.arquivos.filter(file => file.id !== 'file1')
        }

        mockFunctions.removeFileFromFolder.mockReturnValue(updatedFolder)
        mockFunctions.mutateAsync.mockResolvedValue(true)

        const { result } = setupHook()

        await act(async () => {
            await result.current.handleDeleteFile('1', 'file1')
        })

        expect(mockFunctions.removeFileFromFolder).toHaveBeenCalled()

        expect(mockFunctions.mutateAsync).toHaveBeenCalledWith(['file1'])

        expect(setUploadedFilesMock).toHaveBeenCalledWith([updatedFolder])
        expect(onUploadedFilesChangeMock).toHaveBeenCalledWith([updatedFolder])

        expect(mockFunctions.updateChips).toHaveBeenCalledWith([updatedFolder])
    })
})
