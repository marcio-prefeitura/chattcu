import { useState } from 'react'
import { SelectChangeEvent } from '@mui/material'
import { IFolder } from '../shared/interfaces/Folder'
import { copyFile, moveFile } from '../infrastructure/api'
import { MoveCopyFilesApiResponse } from '../components/folder-actions-menu/FolderActionsMenu'

interface UseFileModalProps {
    handleOpenModal: (isOpen: boolean) => void
    operation: 'move' | 'copy'
    file: any | null
    filteredFolder: any[]
    onCopyFile: (data: any | false, oldFolderUpdated: any) => Promise<void> | null
    onMoveFile: (data: any | false, oldFile: any, oldFolderUpdated: any) => void
}

export const useFileModal = ({
    handleOpenModal,
    operation,
    file,
    filteredFolder,
    onCopyFile,
    onMoveFile
}: UseFileModalProps) => {
    const [selectedFolder, setSelectedFolder] = useState<string>('')
    const [openModalFileExists, setOpenModalFileExists] = useState<boolean>(false)
    const [titleMessageExists, setTitleMessageExists] = useState<string>('')
    const [messageExistsFile, setMessageExistsFile] = useState<string>('')
    const [showCancelButton, setShowCancelButton] = useState<boolean>(false)
    const [showProgress, setShowProgress] = useState<boolean>(false)

    const isFolder = !file.st_arquivo

    const handleClose = () => {
        setSelectedFolder('')
        handleOpenModal(false)
    }

    const handleFolderChange = (event: SelectChangeEvent<string>) => {
        setSelectedFolder(event.target.value)
    }

    const onMoveFileIsFolderChange = async (folderFiles: any) => {
        const movedResults: MoveCopyFilesApiResponse = await moveFile(folderFiles, selectedFolder)

        const filesMoved = movedResults.itens.map(item => item.id)

        const oldFolderUpdated: IFolder = {
            ...file,
            arquivos: file.arquivos.filter(arquivo => !filesMoved.includes(arquivo.id))
        }

        setSelectedFolder('')
        setShowProgress(false)
        handleOpenModal(false)
        onMoveFile(movedResults, selectedFolder, oldFolderUpdated)
    }

    const onMoveFileChange = async () => {
        const movedFile = await moveFile([file.id], selectedFolder)
        setSelectedFolder('')
        setShowProgress(false)
        handleOpenModal(false)
        onMoveFile(movedFile, file, null)
    }
    const onCopyFileChange = async () => {
        const copyResults: MoveCopyFilesApiResponse = await copyFile([file.id], selectedFolder)
        const oldFolderUpdated: IFolder = filteredFolder.find(
            folder => folder.id.toString() === file.id_pasta_pai.toString()
        )

        setSelectedFolder('')
        setShowProgress(false)
        handleOpenModal(false)
        onCopyFile(copyResults, oldFolderUpdated)
    }

    const onCopyFileIsFolderChange = async (folderFiles: any) => {
        const folder: IFolder = file
        const copyResults: MoveCopyFilesApiResponse = await copyFile(folderFiles, selectedFolder)
        const oldFolderUpdated: IFolder = {
            ...folder
        }
        setSelectedFolder('')
        setShowProgress(false)
        handleOpenModal(false)
        onCopyFile(copyResults, oldFolderUpdated)
    }

    const processFiles = async () => {
        setOpenModalFileExists(false)
        setShowProgress(true)
        if (isFolder) {
            const folderFiles = file.arquivos.filter(arquivo => arquivo.selected).map(arquivo => arquivo.id)
            operation === 'move' ? onMoveFileIsFolderChange(folderFiles) : onCopyFileIsFolderChange(folderFiles)
        } else {
            operation === 'move' ? onMoveFileChange() : onCopyFileChange()
        }
    }

    const handleConfirm = async () => {
        try {
            if (!selectedFolder || !file) {
                console.error('Pasta ou arquivo não selecionado.')
                return
            }

            if (isFolder) {
                const selectedFiles = file.arquivos.filter(arquivo => arquivo.selected)
                if (selectedFiles.length < 1) {
                    setTitleMessageExists('Erro')
                    setMessageExistsFile(`Para ${operation}, selecione pelo menos um arquivo.`)
                    setOpenModalFileExists(true)
                    setShowCancelButton(false)
                    return
                }
            }
            processFiles()
            setOpenModalFileExists(false)
            setShowProgress(true)
        } catch (error) {
            console.error(`Erro ao ${operation} o arquivo:`, error)
            setShowProgress(false)
        }
    }

    return {
        selectedFolder,
        openModalFileExists,
        titleMessageExists,
        messageExistsFile,
        showCancelButton,
        showProgress,
        isFolder,
        handleClose,
        handleConfirm,
        handleFolderChange,
        setOpenModalFileExists
    }
}
