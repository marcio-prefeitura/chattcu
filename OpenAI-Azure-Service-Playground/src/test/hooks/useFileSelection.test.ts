import { act, renderHook } from '@testing-library/react'
import { useFileSelection } from '../../hooks/useFileSelection'

const mockIsAllFilesSelected = jest.fn()
const mockGetSelectedFiles = jest.fn()

describe('useFileSelection', () => {
    let uploadedFilesMock
    let setUploadedFilesMock
    let onUploadedFilesChangeMock
    let onSelectFileMock

    beforeEach(() => {
        uploadedFilesMock = [
            {
                id: '1',
                nome: 'Folder 1',
                selected: false,
                open: true,
                arquivos: [
                    { id: 'file1', selected: true },
                    { id: 'file2', selected: true }
                ]
            },
            {
                id: '2',
                nome: 'Folder 2',
                selected: false,
                arquivos: [
                    { id: 'file3', selected: false },
                    { id: 'file4', selected: true }
                ]
            }
        ]

        setUploadedFilesMock = jest.fn()
        onUploadedFilesChangeMock = jest.fn()
        onSelectFileMock = jest.fn()

        mockIsAllFilesSelected.mockReset()
        mockGetSelectedFiles.mockReset()
    })

    it('should not proceed if the file to update is not found', () => {
        const { result } = renderHook(() =>
            useFileSelection({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles: setUploadedFilesMock,
                onUploadedFilesChange: onUploadedFilesChangeMock,
                onSelectFile: onSelectFileMock,
                isAllFilesSelected: mockIsAllFilesSelected,
                getSelectedFiles: mockGetSelectedFiles
            })
        )

        act(() => {
            result.current.handleSelectFile(uploadedFilesMock[0], 'non-existent-file-id', true)
        })

        expect(setUploadedFilesMock).not.toHaveBeenCalled()
        expect(onUploadedFilesChangeMock).not.toHaveBeenCalled()
        expect(onSelectFileMock).not.toHaveBeenCalled()
    })

    it('should update the selected status of a file and refresh the folders', () => {
        mockIsAllFilesSelected.mockReturnValue(true)
        mockGetSelectedFiles.mockReturnValue([{ id: 'file1', selected: true }])

        const { result } = renderHook(() =>
            useFileSelection({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles: setUploadedFilesMock,
                onUploadedFilesChange: onUploadedFilesChangeMock,
                onSelectFile: onSelectFileMock,
                isAllFilesSelected: mockIsAllFilesSelected,
                getSelectedFiles: mockGetSelectedFiles
            })
        )

        act(() => {
            result.current.handleSelectFile(uploadedFilesMock[0], 'file1', true)
        })

        expect(setUploadedFilesMock).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: '1',
                    arquivos: expect.arrayContaining([expect.objectContaining({ id: 'file1', selected: true })])
                })
            ])
        )
        expect(onUploadedFilesChangeMock).toHaveBeenCalled()
        expect(onSelectFileMock).toHaveBeenCalledWith([{ id: 'file1', selected: true }])
    })

    it('should not call onUploadedFilesChange if it is not provided', () => {
        mockIsAllFilesSelected.mockReturnValue(true)
        mockGetSelectedFiles.mockReturnValue([{ id: 'file1', selected: true }])

        const { result } = renderHook(() =>
            useFileSelection({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles: setUploadedFilesMock,
                onUploadedFilesChange: undefined,
                onSelectFile: onSelectFileMock,
                isAllFilesSelected: mockIsAllFilesSelected,
                getSelectedFiles: mockGetSelectedFiles
            })
        )

        act(() => {
            result.current.handleSelectFile(uploadedFilesMock[0], 'file1', true)
        })

        expect(setUploadedFilesMock).toHaveBeenCalled()
        expect(onUploadedFilesChangeMock).not.toHaveBeenCalled()
        expect(onSelectFileMock).toHaveBeenCalled()
    })

    it('should handle selecting all files in a folder', () => {
        mockIsAllFilesSelected.mockReturnValue(true)
        mockGetSelectedFiles.mockReturnValue([
            { id: 'file1', selected: true },
            { id: 'file2', selected: true }
        ])

        const { result } = renderHook(() =>
            useFileSelection({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles: setUploadedFilesMock,
                onUploadedFilesChange: onUploadedFilesChangeMock,
                onSelectFile: onSelectFileMock,
                isAllFilesSelected: mockIsAllFilesSelected,
                getSelectedFiles: mockGetSelectedFiles
            })
        )

        act(() => {
            result.current.handleSelectFile(uploadedFilesMock[0], 'file1', true)
        })

        expect(mockIsAllFilesSelected).toHaveBeenCalledWith(uploadedFilesMock[0])
        expect(setUploadedFilesMock).toHaveBeenCalled()
        expect(onUploadedFilesChangeMock).toHaveBeenCalled()
        expect(onSelectFileMock).toHaveBeenCalled()
    })
})
