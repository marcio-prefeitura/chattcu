import { renderHook, act } from '@testing-library/react'
import { useFileMoved } from '../../hooks/useFileMoved'
import { IFile, IFolder } from '../../shared/interfaces/Folder'

describe('useFileMoved', () => {
    const mockGetFolder = jest.fn()
    const mockOrganizeFolders = jest.fn()

    const setUploadedFiles = jest.fn()
    const onUploadedFilesChange = jest.fn()
    const handleMessageSuccess = jest.fn()

    jest.mock('../../hooks/useFolder', () => ({
        useFolder: () => ({
            getFolder: mockGetFolder,
            organizeFolders: mockOrganizeFolders
        })
    }))

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should move file from one folder to another and update state', async () => {
        const uploadedFilesMock: IFolder[] = [
            {
                id: '1',
                nome: 'Folder 1',
                arquivos: [
                    {
                        id: 'file1',
                        nome: 'File 1',
                        usuario: '',
                        st_removido: false,
                        data_criacao: undefined,
                        st_arquivo: false,
                        tamanho: '',
                        tipo_midia: '',
                        nome_blob: '',
                        status: '',
                        selected: false,
                        progress: 0,
                        id_pasta_pai: ''
                    }
                ],
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
            },
            {
                id: '2',
                nome: 'Folder 2',
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

        const movedFileMock: IFile = {
            id: 'file1',
            id_pasta_pai: '2',
            nome: 'File 1',
            usuario: '',
            st_removido: false,
            data_criacao: undefined,
            st_arquivo: false,
            tamanho: '',
            tipo_midia: '',
            nome_blob: '',
            status: '',
            selected: false,
            progress: 0
        }
        const oldFileMock: IFile = {
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
            selected: false,
            progress: 0
        }
        const mensagemMock = 'File moved successfully!'

        mockGetFolder.mockImplementation((folders, folderId) => {
            return folders.find(folder => folder.id.toString() === folderId)
        })

        const { result } = renderHook(() =>
            useFileMoved({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles,
                onUploadedFilesChange,
                handleMessageSuccess
            })
        )

        await act(async () => {
            await result.current.handleMovedFile(movedFileMock, oldFileMock, mensagemMock)
        })

        expect(handleMessageSuccess).toHaveBeenCalledWith(mensagemMock, true)

        expect(setUploadedFiles).toHaveBeenCalled()

        const updatedFolders = uploadedFilesMock.map(folder => {
            if (Number(folder.id) === 2) {
                return {
                    ...folder,
                    arquivos: [
                        {
                            id: 'file1',
                            id_pasta_pai: '2',
                            nome: 'File 1',
                            usuario: '',
                            st_removido: false,
                            data_criacao: undefined,
                            st_arquivo: false,
                            tamanho: '',
                            tipo_midia: '',
                            nome_blob: '',
                            status: '',
                            selected: false,
                            progress: 0,
                            show: true,
                            uploaded: true
                        }
                    ],
                    open: true
                }
            } else if (Number(folder.id) === 1) {
                return {
                    ...folder,
                    arquivos: [],
                    open: false
                }
            }
            return folder
        })

        expect(onUploadedFilesChange).toHaveBeenCalledWith(updatedFolders)
    })

    it('should not move file if folder does not exist', async () => {
        mockGetFolder.mockReturnValueOnce(undefined)

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

        const movedFileMock: IFile = {
            id: 'file1',
            id_pasta_pai: '2',
            nome: 'File 1',
            usuario: '',
            st_removido: false,
            data_criacao: undefined,
            st_arquivo: false,
            tamanho: '',
            tipo_midia: '',
            nome_blob: '',
            status: '',
            selected: false,
            progress: 0
        }
        const oldFileMock: IFile = {
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
            selected: false,
            progress: 0
        }
        const mensagemMock = 'File moved successfully!'

        const { result } = renderHook(() =>
            useFileMoved({
                uploadedFiles: uploadedFilesMock,
                setUploadedFiles,
                onUploadedFilesChange,
                handleMessageSuccess
            })
        )

        await act(async () => {
            await result.current.handleMovedFile(movedFileMock, oldFileMock, mensagemMock)
        })

        expect(handleMessageSuccess).not.toHaveBeenCalled()

        expect(setUploadedFiles).not.toHaveBeenCalled()
        expect(onUploadedFilesChange).not.toHaveBeenCalled()
    })
})
