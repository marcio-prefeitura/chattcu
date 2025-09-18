import { IFile, IFolder } from '../shared/interfaces/Folder'
import { useFolder } from './useFolder'

export const useCopyFileToFolder = () => {
    const { getFolder } = useFolder()
    const copyFileToFolder = (targetFolders: IFolder[], copiedFile: any) => {
        const folderSelected = getFolder(targetFolders, copiedFile.id_pasta_pai.toString())

        if (!folderSelected) {
            return [...targetFolders]
        }

        const file: IFile = {
            ...copiedFile,
            uploaded: true,
            show: true,
            selected: false
        }

        folderSelected.arquivos = [...folderSelected.arquivos, file]
        folderSelected.selected = false
        folderSelected.open = true

        const folders = targetFolders.map(folder => {
            if (folder.id.toString() === folderSelected.id.toString()) {
                return folderSelected
            }

            return folder
        })
        return folders
    }
    return { copyFileToFolder }
}
