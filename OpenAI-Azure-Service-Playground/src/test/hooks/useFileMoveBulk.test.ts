import { renderHook, act } from '@testing-library/react'
import { IFolder } from '../../shared/interfaces/Folder'
import { useFileMoveBulk } from '../../hooks/useFileMoveBulk'

describe('useFileMoveBulk', () => {
    const setUploadedFiles = jest.fn()
    const onUploadedFilesChange = jest.fn()
    const handleMessageSuccess = jest.fn()

    // Mock do hook useFolder
    jest.mock('../../hooks/useFolder', () => ({
        useFolder: () => ({
            organizeFolders: jest.fn(folders => folders) // Simplesmente retorna as pastas passadas
        })
    }))

    const uploadedFiles: IFolder[] = [
        {
            id: '1',
            nome: 'Folder 1',
            arquivos: [
                {
                    id: '101',
                    nome: 'file1.txt',
                    selected: false,
                    uploaded: false,
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
            open: false,
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
        },
        {
            id: '2',
            nome: 'Folder 2',
            arquivos: [],
            open: false,
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

    const movedFiles = [{ id: '201', nome: 'newFile.pdf', id_pasta_pai: '1' }]

    const oldFolderUpdated: IFolder = {
        id: '1',
        nome: 'Folder 1',
        arquivos: [],
        open: false,
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

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should not update folders when movedFiles is empty', async () => {
        const { result } = renderHook(() =>
            useFileMoveBulk({
                uploadedFiles,
                setUploadedFiles,
                onUploadedFilesChange,
                handleMessageSuccess
            })
        )

        await act(async () => {
            return await result.current.handleMovedFileBulk([], '2', oldFolderUpdated, 'Success message')
        })

        expect(setUploadedFiles).not.toHaveBeenCalled()
        expect(onUploadedFilesChange).not.toHaveBeenCalled()
        expect(handleMessageSuccess).not.toHaveBeenCalled()
    })

    it('should handle moved files and update folders correctly', async () => {
        const { result } = renderHook(() =>
            useFileMoveBulk({
                uploadedFiles,
                setUploadedFiles,
                onUploadedFilesChange,
                handleMessageSuccess
            })
        )

        await act(async () => {
            await result.current.handleMovedFileBulk(movedFiles, '2', oldFolderUpdated, 'Success message')
        })

        expect(setUploadedFiles).toHaveBeenCalled()
        expect(onUploadedFilesChange).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id: '1', arquivos: expect.any(Array) }),
                expect.objectContaining({ id: '2', open: true })
            ])
        )

        expect(handleMessageSuccess).toHaveBeenCalledWith('Success message', true)
    })

    it('should mark all files as uploaded', async () => {
        const { result } = renderHook(() =>
            useFileMoveBulk({
                uploadedFiles,
                setUploadedFiles,
                onUploadedFilesChange,
                handleMessageSuccess
            })
        )

        await act(async () => {
            await result.current.handleMovedFileBulk(movedFiles, '2', oldFolderUpdated, 'Success message')
        })

        expect(onUploadedFilesChange).toHaveBeenCalled()
    })

    it('should mark all files as uploaded and not change unrelated folders', async () => {
        const unrelatedFolder: IFolder = {
            id: '99',
            nome: 'Unrelated Folder',
            arquivos: [
                {
                    id: '999',
                    nome: 'file1.txt',
                    selected: false,
                    uploaded: false,
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
            open: false,
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

        const uploadedFiles = [
            {
                id: '1',
                nome: 'Folder 1',
                arquivos: [],
                open: false,
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
            },
            {
                id: '2',
                nome: 'Folder 2',
                arquivos: [],
                open: false,
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
            },
            unrelatedFolder
        ]

        const { result } = renderHook(() =>
            useFileMoveBulk({
                uploadedFiles,
                setUploadedFiles,
                onUploadedFilesChange,
                handleMessageSuccess
            })
        )

        const movedFiles = [{ id: '201', nome: 'newFile.pdf', id_pasta_pai: '1' }]
        const oldFolderUpdated: IFolder = {
            id: '1',
            nome: 'Folder 1',
            arquivos: [],
            open: false,
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

        await act(async () => {
            return await result.current.handleMovedFileBulk(movedFiles, '2', oldFolderUpdated, 'Success message')
        })

        expect(onUploadedFilesChange).toHaveBeenCalled()
    })
})
