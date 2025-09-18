import { IFolder } from '../shared/interfaces/Folder'
import { ISelectedFiles } from '../shared/interfaces/SelectedFiles'
import { filterUploadedFiles } from '../utils/FilterUtils'

export interface FilteredResult {
    filteredFolders: IFolder[]
    allHidden: boolean
}

export function useFolder() {
    /**
     * Retorna uma pasta de uma lista de pastas com base em seu ID.
     * @param folders O array de pastas.
     * @param folderId O ID da pasta a ser recuperada.
     * @returns A pasta com o ID especificado, ou undefined se não encontrada.
     */
    const getFolder = (folders: IFolder[], folderId: string): IFolder => {
        const folder = folders.find(folder => folder.id.toString() === folderId.toString())
        return folder!
    }

    /**
     * Obtém todos os arquivos selecionados de uma lista de pastas para exibir nos chip's.
     * @param folders Uma lista de pastas da qual deseja-se obter os arquivos selecionados.
     * @returns Uma lista de objetos contendo o nome da pasta e os arquivos selecionados dentro dela.
     */
    const getSelectedFiles = (folders: IFolder[] = []): ISelectedFiles[] => {
        const foldersWithSelectedFiles = folders.map(folder => {
            const selectedFiles = folder.arquivos.filter(arquivo => arquivo.selected)
            return {
                folder_name: folder.nome,
                selected_files: selectedFiles
            }
        })
        return foldersWithSelectedFiles.filter(folder => folder.selected_files.length > 0)
    }

    /**
     * Obtém os IDs dos arquivos selecionados a partir de uma lista de objetos de arquivos selecionados.
     * @param selectedFiles Uma lista de objetos contendo informações sobre arquivos selecionados.
     * @returns Uma lista de IDs dos arquivos selecionados.
     */
    const getSelectedFileIds = (selectedFiles: ISelectedFiles[]): string[] => {
        const selectedFileIds: string[] = []

        selectedFiles.forEach(folder => {
            folder.selected_files.forEach(file => {
                selectedFileIds.push(file.id)
            })
        })

        return selectedFileIds
    }

    /**
     * Obtém os IDs dos arquivos prontos para processamento a partir de uma lista de objetos de arquivos selecionados.
     * @param folders Uma lista de objetos contendo informações sobre arquivos selecionados.
     * @returns Uma lista de IDs dos arquivos prontos para processamento.
     */
    const getReadyFileIds = (folders: ISelectedFiles[]): string[] => {
        const selectedFilesReady = folders.map(folder =>
            folder.selected_files.filter(file => file.status === 'PRONTO').map(file => file.id)
        )

        const FilesIds = selectedFilesReady.flat()

        return FilesIds
    }

    /**
     * Desseleciona a pasta especificada e seus arquivos dentro da lista de pastas filtradas.
     * @param folderUnselected - A pasta a ser desselecionada.
     * @param folders - A lista de pastas filtradas.
     * @returns Uma nova lista de pastas com a pasta especificada desselecionada e seus arquivos desselecionados.
     */
    const unSelectFolder = (folderUnselectedId: string, folders: IFolder[]) => {
        if (!folderUnselectedId) return folders

        return folders.map(folder => {
            if (folder.id === folderUnselectedId) {
                return {
                    ...folder,
                    selected: false,
                    arquivos: folder.arquivos.map(arquivo => ({ ...arquivo, selected: false }))
                }
            }
            return folder
        })
    }

    /**
     * Fecha todas as pastas passadas por parâmetro.
     * @param folders - As pastas a serem fechadas.
     * @returns Uma nova matriz de pastas com todas as pastas fechadas.
     */
    const closeAllFolders = (folders: IFolder[]) => {
        return folders.map(folder => ({
            ...folder,
            open: false,
            show: true,
            arquivos: folder.arquivos.map(arquivo => ({ ...arquivo, show: true }))
        }))
    }

    /**
     * Fecha uma pasta em uma lista de pastas passadas por parâmetro.
     * @param folders - As lista de pastas.
     * @param folder - As pasta a ser fechada.
     * @returns Uma nova matriz de pastas com a pasta passada por parâmetro fechada.
     */
    const closeFolder = (folders: IFolder[], folderToClose: IFolder): IFolder[] => {
        return folders.map(folder => {
            if (folder.id === folderToClose.id) {
                return { ...folder, open: false }
            }
            return folder
        })
    }

    /**
     * Filtra pastas e arquivos com base em um texto fornecido, atualizando a propriedade 'show'.
     * @param folders A lista de pastas a ser filtrada.
     * @param text O texto a ser pesquisado.
     * @returns As pastas filtradas com a propriedade 'show' atualizada.
     */
    const filterFoldersAndFiles = (folders: IFolder[], text: string): IFolder[] => {
        return filterUploadedFiles(folders, text)
    }

    /**
     * Adiciona uma pasta à lista de pastas.
     * @param folders A lista de pastas existentes.
     * @param folder A nova pasta a ser adicionada.
     * @returns Uma nova lista de pastas com a pasta adicionada.
     */
    const addFolder = (folders: IFolder[], folder: IFolder) => {
        folder.arquivos = []
        folder.show = true
        return [...folders, folder]
    }

    /**
     * Remove uma pasta na lista de pastas.
     * @param folders A lista de pastas existentes.
     * @param folderId o id da pasta a ser removida.
     * @returns Uma nova lista de pastas com a pasta removida.
     */
    const removeFolder = (folders: IFolder[], folderId: string) => {
        return folders.filter(folder => folder.id !== folderId)
    }

    /**
     * Atualiza uma pasta no objeto de pastas.
     * @param folders A lista de pastas.
     * @param updatedFolder A pasta atualizada pra ser alterada na lista.
     * @returns A lista de pastas atualizada.
     */
    const updateFolders = (folders: IFolder[], updatedFolder: IFolder): IFolder[] => {
        return folders.map(folder => (folder.id.toString() === updatedFolder.id.toString() ? updatedFolder : folder))
    }

    /**
     * Seleciona os arquivos com base no array de arquivos selecionados.
     * @param folders A lista de pastas.
     * @param selectedFiles O array de arquivos selecionados.
     * @returns Uma nova lista de pastas com os arquivos selecionados atualizados.
     */
    const selectFiles = (folders: IFolder[], selectedFiles: ISelectedFiles[]): IFolder[] => {
        const selectedFileIds = selectedFiles.flatMap(folder => folder.selected_files.map(file => file.id))

        return folders.map(folder => {
            const allFilesSelected =
                folder.arquivos.length > 0 && folder.arquivos.every(file => selectedFileIds.includes(file.id))

            return {
                ...folder,
                selected: allFilesSelected,
                arquivos: folder.arquivos.map(file => ({
                    ...file,
                    selected: selectedFileIds.includes(file.id)
                }))
            }
        })
    }

    /**
     * Organiza a lista de pastas.
     * A primeira pasta é "Arquivos Gerais".
     * Em seguida, as pastas com arquivos, ordenadas alfabeticamente.
     * Por último, as pastas sem arquivos, ordenadas alfabeticamente.
     * @param folders A lista de pastas a ser organizada.
     * @returns A lista de pastas organizada.
     */
    const organizeFolders = (folders: IFolder[]): IFolder[] => {
        const generalFilesFolder = folders.find(folder => folder.nome === 'Arquivos gerais')

        // Filtra as pastas que possuem arquivos
        const foldersWithFiles = folders.filter(
            folder => folder.arquivos.length > 0 && folder.nome !== 'Arquivos gerais'
        )

        // Filtra as pastas que não possuem arquivos
        const foldersWithoutFiles = folders.filter(
            folder => folder.arquivos.length === 0 && folder.nome !== 'Arquivos gerais'
        )

        // Ordena as pastas com arquivos por nome
        foldersWithFiles.sort((a, b) => a.nome.localeCompare(b.nome))
        // Ordena as pastas sem arquivos por nome
        foldersWithoutFiles.sort((a, b) => a.nome.localeCompare(b.nome))

        return [generalFilesFolder!, ...foldersWithFiles, ...foldersWithoutFiles]
    }

    return {
        getFolder,
        getSelectedFiles,
        getSelectedFileIds,
        getReadyFileIds,
        unSelectFolder,
        closeAllFolders,
        closeFolder,
        filterFoldersAndFiles,
        addFolder,
        removeFolder,
        updateFolders,
        selectFiles,
        organizeFolders
    }
}
