import { IFolder } from '../shared/interfaces/Folder'
import { useFolder } from './useFolder'

interface UseFileMoveBulkProps {
    uploadedFiles: IFolder[]
    setUploadedFiles: (folders: IFolder[]) => void
    onUploadedFilesChange: (folders: IFolder[]) => void
    handleMessageSuccess: (message: string, show?: boolean) => void
}

export const useFileMoveBulk = ({
    uploadedFiles,
    setUploadedFiles,
    onUploadedFilesChange,
    handleMessageSuccess
}: UseFileMoveBulkProps) => {
    const { organizeFolders } = useFolder()

    const handleMovedFileBulk = async (
        movedFiles: any[],
        selectedFolder: any,
        oldFolderUpdated: IFolder,
        mensagem: string
    ) => {
        if (movedFiles.length <= 0) {
            return
        }

        const updatedFolders: IFolder[] = uploadedFiles.map(folder => {
            if (movedFiles.length > 0 && folder.id.toString() === movedFiles[0].id_pasta_pai.toString()) {
                movedFiles.forEach(movedFile => {
                    if (!folder.arquivos.some(file => file.id === movedFile.id)) {
                        movedFile.selected = false
                        movedFile.show = true
                        folder.arquivos.push(movedFile)
                    }
                })
            }

            if (folder.id.toString() === oldFolderUpdated.id.toString()) {
                folder = oldFolderUpdated
                folder.selected = false
                folder.open = false
                folder.arquivos = oldFolderUpdated.arquivos.map(arquivo => ({
                    ...arquivo,
                    selected: false
                }))

                if (!folder.arquivos.length) folder.open = false
            }

            if (folder.id.toString() === selectedFolder.toString()) {
                folder.open = true
            }

            folder.arquivos.forEach(file => {
                file.uploaded = true
            })

            return folder
        })

        const organizedFolders = organizeFolders(updatedFolders)
        setUploadedFiles(organizedFolders)
        onUploadedFilesChange(organizedFolders)

        handleMessageSuccess(mensagem, true)
    }

    return { handleMovedFileBulk }
}
