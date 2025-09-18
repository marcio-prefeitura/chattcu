import { IFile, IFolder } from '../shared/interfaces/Folder'
import { useFile } from './useFile'
import { useFolder } from './useFolder'

interface UseFileDeletionProps {
    uploadedFiles: IFolder[]
    setUploadedFiles: (folders: IFolder[]) => void
    onUploadedFilesChange: (folders: IFolder[]) => void
    mutateDeleteFiles: {
        mutateAsync: (fileIds: string[]) => Promise<boolean>
    }
    updateChips: (updatedFolders: IFolder[]) => void
    mutateDeleteFile: {
        mutateAsync: (fileIds: string[]) => Promise<boolean>
    }
}

export const useFileDeletion = ({
    uploadedFiles,
    setUploadedFiles,
    onUploadedFilesChange,
    mutateDeleteFiles,
    updateChips,
    mutateDeleteFile
}: UseFileDeletionProps) => {
    const { getFilesId, removeFolderFiles, getSelectedFolderFiles, removeFileFromFolder } = useFile()
    const { updateFolders, organizeFolders, getFolder } = useFolder()

    const handleDeleteFiles = async (folder: IFolder) => {
        folder.open = false
        folder.selected = false
        const selectedFiles: IFile[] = getSelectedFolderFiles(folder)

        if (!selectedFiles || selectedFiles.length === 0) return

        const selectedIds: string[] = getFilesId(selectedFiles)
        const folderUpdated: IFolder = removeFolderFiles(folder, selectedIds)
        const updatedFolders: IFolder[] = updateFolders(uploadedFiles, folderUpdated)

        const isDeleteSuccessful = await mutateDeleteFiles.mutateAsync(selectedIds)

        if (isDeleteSuccessful) {
            updateChips(updatedFolders)
            setUploadedFiles(organizeFolders(updatedFolders))
            onUploadedFilesChange(updatedFolders)
        }
    }

    const handleDeleteFile = async (folderId: string, fileId: string) => {
        let folderSelected = getFolder(uploadedFiles, folderId)
        folderSelected = removeFileFromFolder(folderSelected, fileId)

        const folders = uploadedFiles.map(folder => {
            if (folderSelected.arquivos.length === 0) {
                folderSelected.selected = false
                folderSelected.open = false
            }
            if (folder.id.toString() === folderSelected.id.toString()) return { ...folderSelected }
            return folder
        })

        setUploadedFiles(folders)
        onUploadedFilesChange(folders)

        const isDeleteSuccessful = await mutateDeleteFile.mutateAsync([fileId])
        if (isDeleteSuccessful) {
            updateChips(folders)
        }
    }

    return { handleDeleteFiles, handleDeleteFile }
}
