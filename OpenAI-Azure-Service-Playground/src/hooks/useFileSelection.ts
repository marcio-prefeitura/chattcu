import { IFolder } from '../shared/interfaces/Folder'
import { ISelectedFiles } from '../shared/interfaces/SelectedFiles'

interface UseFileSelectionProps {
    uploadedFiles: IFolder[]
    setUploadedFiles: (folders: IFolder[]) => void
    onUploadedFilesChange?: (folders: IFolder[]) => void
    onSelectFile: (selectedFiles: ISelectedFiles[]) => void
    isAllFilesSelected: (folder: IFolder) => boolean
    getSelectedFiles: (folders: IFolder[]) => ISelectedFiles[]
}

export const useFileSelection = ({
    uploadedFiles,
    setUploadedFiles,
    onUploadedFilesChange,
    onSelectFile,
    isAllFilesSelected,
    getSelectedFiles
}: UseFileSelectionProps) => {
    const handleSelectFile = (folderSelect: IFolder, fileId: string, checked: boolean) => {
        const folderSelected = uploadedFiles.find(folder => folder.id.toString() === folderSelect.id.toString())
        if (!folderSelected) return

        const fileSelected = folderSelected.arquivos.find(arquivo => arquivo.id === fileId)
        if (!fileSelected) return

        const updatedFiles = folderSelected.arquivos.map(arquivo => ({
            ...arquivo,
            selected: arquivo.id === fileId ? checked : arquivo.selected
        }))

        const updatedFolder = {
            ...folderSelected,
            arquivos: updatedFiles,
            open: true
        }

        const isAllSelected = isAllFilesSelected(updatedFolder)

        const updatedFolders = uploadedFiles.map(folder =>
            folder.id === folderSelected.id ? { ...updatedFolder, selected: isAllSelected } : folder
        )

        setUploadedFiles(updatedFolders)
        if (onUploadedFilesChange) {
            onUploadedFilesChange(updatedFolders)
        }

        const selectedFiles: ISelectedFiles[] = getSelectedFiles(updatedFolders)
        onSelectFile(selectedFiles)
    }

    return { handleSelectFile }
}
