import { IFile, IFolder } from '../shared/interfaces/Folder'
import { useFolder } from './useFolder'

interface UseFileMovedProps {
    uploadedFiles: IFolder[]
    setUploadedFiles: (folders: IFolder[]) => void
    onUploadedFilesChange: (folders: IFolder[]) => void
    handleMessageSuccess: (message: string, show?: boolean) => void
}

export const useFileMoved = ({
    uploadedFiles,
    setUploadedFiles,
    onUploadedFilesChange,
    handleMessageSuccess
}: UseFileMovedProps) => {
    const { getFolder, organizeFolders } = useFolder()
    const handleMovedFile = async (movedFile: any, oldFile: any, mensagem: string) => {
        const folderFiltered = getFolder(uploadedFiles, oldFile.id_pasta_pai.toString())
        const folderSelected = getFolder(uploadedFiles, movedFile.id_pasta_pai.toString())

        if (folderSelected !== undefined && folderFiltered !== undefined) {
            const file: IFile = {
                ...movedFile,
                selected: false,
                uploaded: true,
                show: true
            }

            const updatedFolderSelected = {
                ...folderSelected,
                open: true,
                arquivos: [...folderSelected.arquivos, file]
            }

            const updatedFolderFiltered = {
                ...folderFiltered,
                open: false,
                arquivos: folderFiltered.arquivos.filter((f: any) => f.id !== oldFile.id)
            }

            handleMessageSuccess(mensagem, true)

            const updatedFolders = uploadedFiles.map(folder => {
                if (folder.id.toString() === folderSelected.id.toString()) {
                    return updatedFolderSelected
                } else if (folder.id.toString() === folderFiltered.id.toString()) {
                    updatedFolderFiltered.selected = false
                    if (!updatedFolderFiltered.arquivos.length) {
                        updatedFolderFiltered.open = false
                    }
                    return updatedFolderFiltered
                }
                return folder
            })
            setUploadedFiles(organizeFolders(updatedFolders))
            onUploadedFilesChange(updatedFolders)
        }
    }
    return { handleMovedFile }
}
