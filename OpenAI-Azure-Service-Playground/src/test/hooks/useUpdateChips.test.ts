import { renderHook, act } from '@testing-library/react'
import { useUpdateChips } from '../../hooks/useUpdateChips'
import { IFolder } from '../../shared/interfaces/Folder'

const mockGetSelectedFiles = jest.fn()

describe('useUpdateChips', () => {
    let mockFolders: IFolder[]
    let mockOnMoveFolder: jest.Mock

    beforeEach(() => {
        mockFolders = [
            {
                id: '1',
                nome: 'Folder 1',
                selected: true,
                open: false,
                arquivos: [
                    {
                        id: 'file1',
                        selected: true,
                        nome: 'File 1',
                        usuario: 'user1',
                        st_removido: false,
                        id_pasta_pai: '',
                        data_criacao: undefined,
                        st_arquivo: false,
                        tamanho: '',
                        tipo_midia: '',
                        nome_blob: '',
                        status: '',
                        progress: 0
                    }
                ],
                usuario: 'user1',
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

        mockOnMoveFolder = jest.fn()
        mockGetSelectedFiles.mockReset()
    })

    it('should call getSelectedFiles and onMoveFolder with correct arguments', () => {
        const selectedFiles = [{ id: 'file1', nome: 'File 1', usuario: 'user1', selected: true }]

        mockGetSelectedFiles.mockReturnValue(selectedFiles)

        const { result } = renderHook(() =>
            useUpdateChips({
                getSelectedFiles: mockGetSelectedFiles,
                onMoveFolder: mockOnMoveFolder
            })
        )

        act(() => {
            result.current.updateChips(mockFolders)
        })

        expect(mockGetSelectedFiles).toHaveBeenCalledWith(mockFolders)
        expect(mockOnMoveFolder).toHaveBeenCalledWith(selectedFiles)
    })

    it('should not call onMoveFolder if getSelectedFiles returns an empty array', () => {
        mockGetSelectedFiles.mockReturnValue([])

        const { result } = renderHook(() =>
            useUpdateChips({
                getSelectedFiles: mockGetSelectedFiles,
                onMoveFolder: mockOnMoveFolder
            })
        )

        act(() => {
            result.current.updateChips(mockFolders)
        })

        expect(mockGetSelectedFiles).toHaveBeenCalledWith(mockFolders)
        expect(mockOnMoveFolder).toHaveBeenCalled()
    })
})
