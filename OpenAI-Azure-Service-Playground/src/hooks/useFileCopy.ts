import { IFile, IFolder } from '../shared/interfaces/Folder'
import { useFolder } from './useFolder'

interface UseFileCopyProps {
    uploadedFiles: IFolder[]
    setUploadedFiles: (folders: IFolder[]) => void
    onUploadedFilesChange: (folders: IFolder[]) => void
    handleMessageSuccess: (message: string, show?: boolean) => void
    copyFileToFolder: (targetFolders: IFolder[], copiedFile: any) => IFolder[]
    updateChips: (updatedFolders: IFolder[]) => void
    unselectAllFiles: (folder: IFolder) => IFolder
}

export const useFileCopy = ({
    uploadedFiles,
    setUploadedFiles,
    onUploadedFilesChange,
    handleMessageSuccess,
    copyFileToFolder,
    unselectAllFiles,
    updateChips
}: UseFileCopyProps) => {
    const { organizeFolders, updateFolders } = useFolder()

    const handleCopiedFile = (copiedFiles: IFile[], oldFolderUpdated: IFolder, mensagem: string) => {
        if (copiedFiles.length) {
            copiedFiles.forEach(file => {
                const folders = copyFileToFolder(uploadedFiles, file)

                if (folders) {
                    oldFolderUpdated.selected = false
                    oldFolderUpdated.open = false
                    const folderWithAllFilesUnselected = unselectAllFiles(oldFolderUpdated)
                    const updatedFolders = updateFolders(folders, folderWithAllFilesUnselected)
                    handleMessageSuccess(mensagem, true)
                    setUploadedFiles(organizeFolders(updatedFolders))
                    onUploadedFilesChange(updatedFolders)
                    updateChips(updatedFolders)
                }
            })
        }
    }
    return { handleCopiedFile }
}
