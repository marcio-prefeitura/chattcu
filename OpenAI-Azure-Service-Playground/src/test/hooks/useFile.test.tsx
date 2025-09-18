import { useFile } from '../../hooks/useFile'
import { IFile, IFolder } from '../../shared/interfaces/Folder'

describe('useFile', () => {
    let folder: IFolder

    beforeEach(() => {
        folder = {
            id: 'folderId',
            nome: 'Folder Name',
            usuario: 'User 1',
            st_removido: false,
            id_pasta_pai: 'parentFolderId',
            data_criacao: new Date(),
            st_arquivo: false,
            tamanho: '',
            tipo_midia: '',
            nome_blob: '',
            status: '',
            arquivos: [
                {
                    id: '1',
                    nome: 'File 1',
                    usuario: 'User 1',
                    st_removido: false,
                    id_pasta_pai: 'folderId',
                    data_criacao: new Date(),
                    st_arquivo: true,
                    tamanho: 1024,
                    tipo_midia: 'pdf',
                    nome_blob: '',
                    status: '',
                    selected: false,
                    progress: 0
                },
                {
                    id: '2',
                    nome: 'File 2',
                    usuario: 'User 2',
                    st_removido: false,
                    id_pasta_pai: 'folderId',
                    data_criacao: new Date(),
                    st_arquivo: true,
                    tamanho: 2048,
                    tipo_midia: 'doc',
                    nome_blob: '',
                    status: '',
                    selected: false,
                    progress: 0
                },
                {
                    id: '3',
                    nome: 'File 3',
                    usuario: 'User 3',
                    st_removido: false,
                    id_pasta_pai: 'folderId',
                    data_criacao: new Date(),
                    st_arquivo: true,
                    tamanho: 3072,
                    tipo_midia: 'txt',
                    nome_blob: '',
                    status: '',
                    selected: false,
                    progress: 0
                }
            ],
            open: true,
            upload: false,
            show: false,
            selected: false
        }
    })

    test('Deve obter os arquivos selecionados de uma pasta', () => {
        const { getSelectedFolderFiles } = useFile()
        const selectedFiles = getSelectedFolderFiles(folder)
        expect(selectedFiles.length).toBe(0)
    })

    test('Deve obter os IDs dos arquivos de uma pasta', () => {
        const { getFilesId } = useFile()
        const fileIds = getFilesId(folder.arquivos)
        expect(fileIds).toEqual(['1', '2', '3'])
    })

    test('Deve remover arquivos de uma pasta', () => {
        const { removeFolderFiles } = useFile()
        const folderWithoutFiles = removeFolderFiles(folder, ['1', '3'])
        expect(folderWithoutFiles.arquivos.length).toBe(1)
        expect(folderWithoutFiles.arquivos[0].id).toBe('2')
    })

    test('Deve atualizar um arquivo em uma pasta', () => {
        const { updateFolderFiles } = useFile()
        const updatedFile: IFile = {
            id: '1',
            nome: 'Updated File 1',
            usuario: 'User 1',
            st_removido: false,
            id_pasta_pai: 'folderId',
            data_criacao: new Date(),
            st_arquivo: false,
            tamanho: '',
            tipo_midia: '',
            nome_blob: '',
            status: '',
            selected: false,
            progress: 0
        }
        const folderWithUpdatedFile = updateFolderFiles(folder, updatedFile)
        const updatedFileInFolder = folderWithUpdatedFile.arquivos.find(file => file.id === '1')
        expect(updatedFileInFolder).toEqual(updatedFile)
    })

    test('Deve verificar se todos os arquivos de uma pasta estão selecionados', () => {
        const { isAllFilesSelected } = useFile()
        const allFilesSelected = isAllFilesSelected(folder)
        expect(allFilesSelected).toBe(false)
    })

    test('Deve remover um arquivo de uma pasta', () => {
        const { removeFileFromFolder } = useFile()
        const folderWithoutFile = removeFileFromFolder(folder, '2')
        expect(folderWithoutFile.arquivos.length).toBe(2)
        expect(folderWithoutFile.arquivos.find(file => file.id === '2')).toBeUndefined()
    })

    test('Deve desselecionar todos os arquivos de uma pasta', () => {
        const { unselectAllFiles } = useFile()
        const folderWithUnselectedFiles = unselectAllFiles(folder)
        const allFilesSelected = folderWithUnselectedFiles.arquivos.every(file => !file.selected)
        expect(allFilesSelected).toBe(true)
    })
})
