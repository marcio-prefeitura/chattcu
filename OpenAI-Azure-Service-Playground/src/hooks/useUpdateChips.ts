import { IFolder } from '../shared/interfaces/Folder'

interface UseUpdateChipsProps {
    getSelectedFiles: (folders: IFolder[]) => any[]
    onMoveFolder: (files: any[]) => void
}

export const useUpdateChips = ({ getSelectedFiles, onMoveFolder }: UseUpdateChipsProps) => {
    const updateChips = (updatedFolders: IFolder[]) => {
        const selectedFiles = getSelectedFiles(updatedFolders)

        onMoveFolder(selectedFiles)
    }

    return { updateChips }
}
