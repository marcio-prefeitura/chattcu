import { ISelectedFiles } from '../../shared/interfaces/SelectedFiles'
import { useFolder } from '../../hooks/useFolder'
import { IFolder } from '../../shared/interfaces/Folder'
// import { filterUploadedFiles } from '../../utils/FilterUtils'

describe('useFolder Hook', () => {
    const {
        getFolder,
        getSelectedFiles,
        getSelectedFileIds,
        getReadyFileIds,
        unSelectFolder,
        closeAllFolders,
        closeFolder,
        // filterFoldersAndFiles,
        addFolder,
        removeFolder,
        updateFolders,
        selectFiles,
        organizeFolders
    } = useFolder()

    const mockFolders: IFolder[] = [
        {
            id: '1',
            nome: 'Folder 1',
            arquivos: [
                {
                    id: 'file1',
                    usuario: 'teste',
                    id_pasta_pai: '1',
                    nome: 'File 1',
                    st_removido: false,
                    data_criacao: null,
                    st_arquivo: true,
                    tamanho: 250,
                    tipo_midia: 'PDF',
                    nome_blob: 'sdasdfas153asdf151sdf',
                    status: 'ativo',
                    selected: false,
                    progress: 50,
                    show: true
                },
                {
                    id: 'file2',
                    usuario: 'teste',
                    id_pasta_pai: '1',
                    nome: 'File 1',
                    st_removido: false,
                    data_criacao: null,
                    st_arquivo: true,
                    tamanho: 250,
                    tipo_midia: 'PDF',
                    nome_blob: 'sdasdfas153asdf151sdf',
                    status: 'PRONTO',
                    selected: false,
                    progress: 50,
                    show: true
                }
            ],
            selected: false,
            open: true,
            show: true,
            usuario: '',
            st_removido: false,
            id_pasta_pai: '',
            data_criacao: null,
            st_arquivo: true,
            tamanho: 250,
            tipo_midia: 'PDF',
            nome_blob: 'sdasdfas153asdf151sdf',
            status: 'ativo'
        },
        {
            id: '2',
            nome: 'Folder 2',
            arquivos: [
                {
                    id: 'file1',
                    usuario: 'teste',
                    id_pasta_pai: '1',
                    nome: 'File 1',
                    st_removido: false,
                    data_criacao: null,
                    st_arquivo: true,
                    tamanho: 250,
                    tipo_midia: 'PDF',
                    nome_blob: 'sdasdfas153asdf151sdf',
                    status: 'ativo',
                    selected: false,
                    progress: 50,
                    show: true
                },
                {
                    id: 'file2',
                    usuario: 'teste',
                    id_pasta_pai: '1',
                    nome: 'File 1',
                    st_removido: false,
                    data_criacao: null,
                    st_arquivo: true,
                    tamanho: 250,
                    tipo_midia: 'PDF',
                    nome_blob: 'sdasdfas153asdf151sdf',
                    status: 'PRONTO',
                    selected: false,
                    progress: 50,
                    show: true
                }
            ],
            selected: false,
            open: true,
            show: true,
            usuario: '',
            st_removido: false,
            id_pasta_pai: '',
            data_criacao: null,
            st_arquivo: true,
            tamanho: 250,
            tipo_midia: 'PDF',
            nome_blob: 'sdasdfas153asdf151sdf',
            status: 'ativo'
        }
    ]

    const mockSelectedFiles: ISelectedFiles[] = [
        {
            folder_name: 'Folder 1',
            selected_files: [
                {
                    id: 'file1',
                    usuario: 'teste',
                    id_pasta_pai: '1',
                    nome: 'File 1',
                    st_removido: false,
                    data_criacao: null,
                    st_arquivo: true,
                    tamanho: 250,
                    tipo_midia: 'PDF',
                    nome_blob: 'sdasdfas153asdf151sdf',
                    status: 'PRONTO',
                    selected: true,
                    progress: 50,
                    show: true
                }
            ]
        },
        {
            folder_name: 'Folder 2',
            selected_files: [
                {
                    id: 'file3',
                    usuario: 'teste',
                    id_pasta_pai: '1',
                    nome: 'File 3',
                    st_removido: false,
                    data_criacao: null,
                    st_arquivo: true,
                    tamanho: 250,
                    tipo_midia: 'PDF',
                    nome_blob: 'sdasdfas153asdf151sdf',
                    status: 'PRONTO',
                    selected: true,
                    progress: 50,
                    show: true
                }
            ]
        }
    ]

    test('getFolder should return the folder with the specified ID', () => {
        const folder = getFolder(mockFolders, '1')
        expect(folder).toEqual(mockFolders[0])
    })

    test('getSelectedFiles should return files marked as selected', () => {
        const selectedFiles = getSelectedFiles(mockFolders)
        expect(selectedFiles).toEqual([])
    })

    test('getSelectedFileIds should return the IDs of selected files', () => {
        const selectedFileIds = getSelectedFileIds(mockSelectedFiles)
        expect(selectedFileIds).toEqual(['file1', 'file3'])
    })

    test('getReadyFileIds should return the IDs of files ready for processing', () => {
        const readyFileIds = getReadyFileIds(mockSelectedFiles)
        expect(readyFileIds).toEqual(['file1', 'file3'])
    })

    test('unSelectFolder should unselect the specified folder and its files', () => {
        const updatedFolders = unSelectFolder('1', mockFolders)
        expect(updatedFolders[0].selected).toBe(false)
        expect(updatedFolders[0].arquivos[0].selected).toBe(false)
    })

    test('closeAllFolders should close all folders and set show to true', () => {
        const updatedFolders = closeAllFolders(mockFolders)
        updatedFolders.forEach(folder => {
            expect(folder.open).toBe(false)
            expect(folder.show).toBe(true)
        })
    })

    test('closeFolder should close the specified folder', () => {
        const updatedFolders = closeFolder(mockFolders, mockFolders[0])
        expect(updatedFolders[0].open).toBe(false)
    })

    // test('filterFoldersAndFiles should filter folders and files based on a text', () => {
    //     (filterUploadedFiles as jest.Mock).mockReturnValue(mockFolders)
    //
    //     const filteredFolders = filterFoldersAndFiles(mockFolders, 'File 1')
    //     expect(filterUploadedFiles).toHaveBeenCalledWith(mockFolders, 'File 1')
    //     expect(filteredFolders).toEqual(mockFolders)
    // })

    test('addFolder should add a new folder to the list', () => {
        const newFolder: IFolder = {
            id: '3',
            nome: 'Folder 3',
            arquivos: [],
            selected: false,
            open: true,
            show: true,
            usuario: '',
            st_removido: false,
            id_pasta_pai: '',
            data_criacao: null,
            st_arquivo: true,
            tamanho: 250,
            tipo_midia: 'PDF',
            nome_blob: 'sdasdfas153asdf151sdf',
            status: 'ativo'
        }
        const updatedFolders = addFolder(mockFolders, newFolder)
        expect(updatedFolders.length).toBe(3)
        expect(updatedFolders[2]).toEqual(newFolder)
    })

    test('removeFolder should remove the folder with the specified ID', () => {
        const updatedFolders = removeFolder(mockFolders, '1')
        expect(updatedFolders.length).toBe(1)
        expect(updatedFolders[0].id).toBe('2')
    })

    test('updateFolders should update the specified folder', () => {
        const updatedFolder: IFolder = { ...mockFolders[0], nome: 'Updated Folder' }
        const updatedFolders = updateFolders(mockFolders, updatedFolder)
        expect(updatedFolders[0].nome).toBe('Updated Folder')
    })

    test('selectFiles should update the selected state of files based on the selected files array', () => {
        const updatedFolders = selectFiles(mockFolders, mockSelectedFiles)
        expect(updatedFolders[0].arquivos[0].selected).toBe(true)
    })

    test('organizeFolders should organize the folders', () => {
        const generalFilesFolder: IFolder = {
            id: '1',
            nome: 'Folder 3',
            arquivos: [],
            selected: false,
            open: true,
            show: true,
            usuario: '',
            st_removido: false,
            id_pasta_pai: '',
            data_criacao: null,
            st_arquivo: true,
            tamanho: 250,
            tipo_midia: 'PDF',
            nome_blob: 'sdasdfas153asdf151sdf',
            status: 'ativo'
        }
        const organizedFolders = organizeFolders([generalFilesFolder, ...mockFolders])
        expect(organizedFolders[0]).toEqual(undefined)
    })
})
