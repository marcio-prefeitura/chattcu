import { IFolder } from '../shared/interfaces/Folder'
import { ISelectedFiles } from '../shared/interfaces/SelectedFiles'

interface UseFolderSelectionProps {
    uploadedFiles: IFolder[]
    onSelectFile: (selectedFiles: ISelectedFiles[]) => void
    onUploadedFilesChange: (updatedFiles: IFolder[]) => void
    setUploadedFiles: React.Dispatch<React.SetStateAction<IFolder[]>>
    getSelectedFiles: (folders: IFolder[]) => ISelectedFiles[]
}

export const useFolderSelection = ({
    uploadedFiles,
    onSelectFile,
    onUploadedFilesChange,
    setUploadedFiles,
    getSelectedFiles
}: UseFolderSelectionProps) => {
    const handleFolderSelected = (folderSelect: any) => {
        const folderSelected = uploadedFiles.find(folder => folder.id === folderSelect.id)
        if (!folderSelected) return
        folderSelected.arquivos = folderSelected.arquivos.map(file => {
            file.selected = !folderSelected.selected
            return file
        })
        const folders = uploadedFiles.map(folder => {
            if (folder.id === folderSelect.id)
                return { ...folderSelected, selected: !folderSelected.selected, open: !folderSelected.open }
            return folder
        })

        /* Retorna os arquivos e pastas selecionados para mostrar no chip */
        const selectedFiles: ISelectedFiles[] = getSelectedFiles(folders)
        onSelectFile(selectedFiles)

        const foldersUpdate = folders.map(folder => {
            if (folder.id === folderSelect.id) return { ...folderSelect, open: true }
            return folder
        })
        setUploadedFiles(foldersUpdate)
        onUploadedFilesChange(foldersUpdate)
    }

    return { handleFolderSelected }
}
