import { renderHook, act } from '@testing-library/react'
import { useCopyFileToFolder } from '../../hooks/useCopyFileToFolder'

const mockGetFolder = jest.fn()

jest.mock('../../hooks/useFolder', () => ({
    useFolder: () => ({
        getFolder: mockGetFolder
    })
}))

describe('useCopyFileToFolder', () => {
    let targetFoldersMock
    let copiedFileMock

    beforeEach(() => {
        targetFoldersMock = [
            {
                id: '1',
                name: 'Folder 1',
                arquivos: [{ id: 'file1' }],
                selected: false,
                open: true
            },
            {
                id: '2',
                name: 'Folder 2',
                arquivos: [],
                selected: false,
                open: true
            }
        ]

        copiedFileMock = {
            id: 'file2',
            id_pasta_pai: '1',
            name: 'File 2',
            uploaded: false,
            show: false,
            selected: false
        }

        mockGetFolder.mockReset()
    })

    it('should copy file to the correct folder', () => {
        // Mockando o retorno do getFolder
        mockGetFolder.mockReturnValue(targetFoldersMock[0]) // Retorna a pasta 1

        const { result } = renderHook(() => useCopyFileToFolder())

        act(() => {
            const folders = result.current.copyFileToFolder(targetFoldersMock, copiedFileMock)
            expect(folders).toBeDefined()
            if (folders) {
                expect(folders).toHaveLength(2) // Garantindo que temos 2 pastas
                expect(folders[0].arquivos).toHaveLength(2) // Pasta 1 deve ter 2 arquivos agora
                expect(folders[0].arquivos[1]).toEqual(
                    expect.objectContaining({
                        id: 'file2',
                        uploaded: true,
                        show: true,
                        selected: false
                    })
                )
                expect(folders[1].arquivos).toHaveLength(0) // Pasta 2 ainda sem arquivos
            }
        })

        // Verificando se a função getFolder foi chamada corretamente
        expect(mockGetFolder).toHaveBeenCalledWith(targetFoldersMock, '1')
    })

    it('should not copy file if folder is not found', () => {
        // Mockando o retorno do getFolder para que a pasta não seja encontrada
        mockGetFolder.mockReturnValue(undefined)

        const { result } = renderHook(() => useCopyFileToFolder())

        act(() => {
            const folders = result.current.copyFileToFolder(targetFoldersMock, copiedFileMock)
            expect(folders).toEqual(targetFoldersMock) // As pastas devem ser retornadas sem alterações
        })

        expect(mockGetFolder).toHaveBeenCalledWith(targetFoldersMock, '1')
    })

    it('should copy file to the folder and update folder status', () => {
        // Mockando o retorno do getFolder
        mockGetFolder.mockReturnValue(targetFoldersMock[0]) // Retorna a pasta 1

        const { result } = renderHook(() => useCopyFileToFolder())

        act(() => {
            const folders = result.current.copyFileToFolder(targetFoldersMock, copiedFileMock)
            if (folders) {
                expect(folders[0].open).toBe(true)
                expect(folders[0].selected).toBe(false)
            }
        })
    })
})
