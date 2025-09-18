import { IFile, IFolder } from '../shared/interfaces/Folder'

export function useFile() {
    /**
     * Obtém os arquivos selecionados de uma pasta.
     * @param folder A pasta da qual deseja-se obter os arquivos selecionados.
     * @returns Uma lista dos arquivos selecionados na pasta.
     */
    const getSelectedFolderFiles = (folder: IFolder): IFile[] => {
        return folder.arquivos.filter(file => file.selected)
    }

    /**
     * Obtém os IDs dos arquivos a partir de uma lista de objetos de arquivos.
     * @param files Uma lista de objetos contendo informações sobre os arquivos.
     * @returns Uma lista de IDs dos arquivos.
     */
    const getFilesId = (files: IFile[]): string[] => {
        return files.map(file => file.id)
    }

    /**
     * Remove arquivos selecionados de uma pasta, com base em seus IDs.
     * @param folder A pasta da qual deseja-se remover os arquivos.
     * @param selectedFilesId Uma lista de IDs dos arquivos que devem ser removidos.
     * @returns Uma pasta com uma nova lista de arquivos, sem os arquivos removidos.
     */
    const removeFolderFiles = (folder: IFolder, selectedFilesId: string[]): IFolder => {
        folder.arquivos = folder.arquivos.filter(file => !selectedFilesId.includes(file.id))
        return folder
    }

    /**
     * Atualiza um arquivo em uma lista de arquivos de uma pasta.
     * @param folder A pasta para atualizar os arquivos.
     * @param file O arquivo a ser atualizado na pasta.
     * @returns A pasta com os arquivos atualizados.
     */
    const updateFolderFiles = (folder: IFolder, updatedFile: IFile): IFolder => {
        folder.arquivos = folder.arquivos.map(file =>
            file.id.toString() === updatedFile.id.toString() ? updatedFile : file
        )
        return folder
    }

    /**
     * Verifica se todos os arquivos de uma pasta estão selecionados.
     * @param folder A pasta da qual deseja-se verificar os arquivos selecionados.
     * @returns Um booleano indicando se todos os arquivos estão selecionados.
     */
    const isAllFilesSelected = (folder: IFolder): boolean => {
        return folder.arquivos.length > 0 && folder.arquivos.every(file => file.selected)
    }

    /**
     * Remove um arquivo de uma lista de arquivos em uma pasta.
     * @param folder A pasta da qual deseja-se remover o arquivo.
     * @param fileId O ID do arquivo a ser removido.
     * @returns A pasta com a lista de arquivos atualizada, sem o arquivo removido.
     */
    const removeFileFromFolder = (folder: IFolder, fileId: string): IFolder => {
        folder.arquivos = folder.arquivos.filter(arquivo => arquivo.id !== fileId)
        return folder
    }

    /**
     * Desseleciona todos os arquivos de uma pasta.
     * @param folder A pasta da qual deseja-se desselecionar os arquivos.
     * @returns Uma pasta com a lista de arquivos atualizada, todos desselecionados.
     */
    const unselectAllFiles = (folder: IFolder): IFolder => {
        folder.arquivos = folder.arquivos.map(file => ({ ...file, selected: false }))
        return folder
    }

    return {
        getSelectedFolderFiles,
        getFilesId,
        removeFolderFiles,
        updateFolderFiles,
        isAllFilesSelected,
        removeFileFromFolder,
        unselectAllFiles
    }
}
