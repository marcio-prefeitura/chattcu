import { renderHook, act } from '@testing-library/react'
import { useFolderSelection } from '../../hooks/useFolderSelection'
import { IFolder } from '../../shared/interfaces/Folder'

const mockGetSelectedFiles = jest.fn()

describe('useFolderSelection', () => {
    let uploadedFilesMock: IFolder[]
    let setUploadedFilesMock: jest.Mock
    let onSelectFileMock: jest.Mock
    let onUploadedFilesChangeMock: jest.Mock

    beforeEach(() => {
        uploadedFilesMock = [
            {
                id: '1',
                nome: 'Folder 1',
                selected: true,
                open: false,
                arquivos: [
                    {
                        id: 'file1',
                        selected: true,
                        nome: '',
                        usuario: '',
                        st_removido: false,
                        id_pasta_pai: '',
                        data_criacao: undefined,
                        st_arquivo: false,
                        tamanho: '',
                        tipo_midia: '',
                        nome_blob: '',
                        status: '',
                        progress: 0
                    },
                    {
                        id: 'file2',
                        selected: true,
                        nome: '',
                        usuario: '',
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
                usuario: '',
                st_removido: false,
                id_pasta_pai: '',
                data_criacao: undefined,
                st_arquivo: false,
                tamanho: '',
                tipo_midia: '',
                nome_blob: '',
                status: ''
            },
            {
                id: '2',
                nome: 'Folder 2',
                selected: true,
                open: false,
                arquivos: [
                    {
                        id: 'file3',
                        selected: true,
                        nome: '',
                        usuario: '',
                        st_removido: false,
                        id_pasta_pai: '',
                        data_criacao: undefined,
                        st_arquivo: false,
                        tamanho: '',
                        tipo_midia: '',
                        nome_blob: '',
                        status: '',
                        progress: 0
                    },
                    {
                        id: 'file4',
                        selected: true,
                        nome: '',
                        usuario: '',
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

        setUploadedFilesMock = jest.fn()
        onSelectFileMock = jest.fn()
        onUploadedFilesChangeMock = jest.fn()

        mockGetSelectedFiles.mockReset()
    })

    it('should do nothing if folder does not exist', () => {
        const { result } = renderHook(() =>
            useFolderSelection({
                uploadedFiles: uploadedFilesMock,
                onSelectFile: onSelectFileMock,
                onUploadedFilesChange: onUploadedFilesChangeMock,
                setUploadedFiles: setUploadedFilesMock,
                getSelectedFiles: mockGetSelectedFiles
            })
        )

        act(() => {
            result.current.handleFolderSelected({
                id: 'non-existent',
                nome: 'Non-existent Folder',
                selected: false,
                open: false,
                arquivos: [],
                usuario: '',
                st_removido: false,
                id_pasta_pai: '',
                data_criacao: undefined,
                st_arquivo: false,
                tamanho: '',
                tipo_midia: '',
                nome_blob: '',
                status: ''
            })
        })

        expect(setUploadedFilesMock).not.toHaveBeenCalled()
        expect(onUploadedFilesChangeMock).not.toHaveBeenCalled()
        expect(onSelectFileMock).not.toHaveBeenCalled()
    })

    it('should deselect all files in the folder when folder is deselected', () => {
        uploadedFilesMock[0].selected = true

        const { result } = renderHook(() =>
            useFolderSelection({
                uploadedFiles: uploadedFilesMock,
                onSelectFile: onSelectFileMock,
                onUploadedFilesChange: onUploadedFilesChangeMock,
                setUploadedFiles: setUploadedFilesMock,
                getSelectedFiles: mockGetSelectedFiles
            })
        )

        act(() => {
            result.current.handleFolderSelected({ ...uploadedFilesMock[0], selected: false })
        })

        expect(setUploadedFilesMock).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: '1',
                    selected: false,
                    arquivos: expect.arrayContaining([
                        expect.objectContaining({ id: 'file1', selected: false }),
                        expect.objectContaining({ id: 'file2', selected: false })
                    ])
                })
            ])
        )
        expect(onUploadedFilesChangeMock).toHaveBeenCalled()
    })

    it('should select all files in the folder when folder is selected', () => {
        const { result } = renderHook(() =>
            useFolderSelection({
                uploadedFiles: uploadedFilesMock,
                onSelectFile: onSelectFileMock,
                onUploadedFilesChange: onUploadedFilesChangeMock,
                setUploadedFiles: setUploadedFilesMock,
                getSelectedFiles: mockGetSelectedFiles
            })
        )

        act(() => {
            result.current.handleFolderSelected(uploadedFilesMock[0])
        })

        expect(setUploadedFilesMock).toHaveBeenCalled()
        expect(onUploadedFilesChangeMock).toHaveBeenCalled()
        expect(onSelectFileMock).toHaveBeenCalled()
    })
})
