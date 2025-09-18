import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Close } from '@mui/icons-material'
import { Box, Chip, IconButton, Tooltip } from '@mui/material'
import { IFile, IFolder } from '../../shared/interfaces/Folder'
import { ISelectedFiles } from '../../shared/interfaces/SelectedFiles'
import { capitalizeFirstLetter } from '../../shared/utils/Text'
import { getMidiaByExtensao } from '../../utils/enum/MidiasAceitasEnum'
import { IUserInfo } from '../../hooks/useUserInfo'

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

interface IInputFilesProps {
    filesSelected: ISelectedFiles[]
    setFilesSelected: any
    foldersRef: React.MutableRefObject<IFolder[]>
    showClearButton: boolean
    setShowClearButton: React.Dispatch<React.SetStateAction<boolean>>
    setUpdatedFoldersFromChipsActions: any
    profile: IUserInfo
}

const InputFiles: React.FC<IInputFilesProps> = ({
    filesSelected,
    setFilesSelected,
    foldersRef,
    showClearButton,
    setShowClearButton,
    setUpdatedFoldersFromChipsActions
}) => {
    const pathname = useLocation()
    const router = useNavigate()

    useEffect(() => {
        const numChips = filesSelected.reduce((total, file) => total + file.selected_files.length, 0)
        setShowClearButton(numChips > 3)
    }, [filesSelected, setShowClearButton])

    const updateFolders = (folders: IFolder[]) => {
        foldersRef.current = folders
    }

    const scrollToFile = async (fileId: string) => {
        await sleep(1000)
        const fileElement = document.getElementById(`treeview-files-${fileId}`)
        if (fileElement) {
            fileElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }

    const openFolder = (file: any) => {
        const folderId: string = file.id_pasta_pai
        const fileId: string = file.id
        const folderUpdated = foldersRef.current?.find(folder => folder.id.toString() === folderId.toString())

        if (folderUpdated) folderUpdated.open = true
        folderUpdated?.arquivos.forEach(arquivo => {
            if (arquivo.id.toString() === fileId.toString()) {
                arquivo.selected = true
            }
        })
        const folders = foldersRef.current?.map(folder => {
            if (folder.id.toString() === folderUpdated?.id.toString()) {
                return folderUpdated
            }
            return folder
        })
        setUpdatedFoldersFromChipsActions(folders)
        updateFolders(folders)
    }

    const clearChipSelection = () => {
        const updatedFolders = foldersRef.current?.map(folder => ({
            ...folder,
            arquivos: folder.arquivos.map(arquivo => ({
                ...arquivo,
                selected: false
            }))
        }))

        if (updatedFolders) {
            foldersRef.current = updatedFolders
            setUpdatedFoldersFromChipsActions(updatedFolders)
        }
    }

    const handleUnselectFile = (fileUnselected: IFile) => {
        const sizeOfActualFiles = filesSelected.reduce((total, file) => total + file.selected_files.length, 0)

        if (sizeOfActualFiles === 1) {
            clearChipSelection()
            setFilesSelected([])
            setShowClearButton(false)
            return
        }

        const filteredFilesSelected = filesSelected
            .map(files => ({
                ...files,
                selected_files: files.selected_files.filter(f => f.id !== fileUnselected.id)
            }))
            .filter(file => file.selected_files.length > 0)

        setFilesSelected(filteredFilesSelected)

        const folderToUpdate = foldersRef.current?.find(
            folder => folder.id.toString() === fileUnselected.id_pasta_pai.toString()
        )

        if (folderToUpdate) {
            folderToUpdate.selected = false
            folderToUpdate.arquivos = folderToUpdate.arquivos.map(f => {
                if (f.id === fileUnselected.id) {
                    return { ...f, selected: false }
                }
                return f
            })

            const newUploadedFiles = foldersRef.current?.map(uF => {
                if (uF.id.toString() === fileUnselected.id_pasta_pai) {
                    return folderToUpdate
                }
                return uF
            })

            foldersRef.current = newUploadedFiles
        }
    }

    const buttonClearAllFiles = () => {
        setFilesSelected([])
        setShowClearButton(false)
    }

    const handleClickFileChip = async (event: React.MouseEvent, file: IFile) => {
        event.preventDefault()

        if (file?.id_pasta_pai) {
            router(`${pathname.pathname}?tab=files`)
            openFolder(file)
            await scrollToFile(file.id)
        }
    }

    return (
        <Box className='chat-box__chip-container'>
            {filesSelected.map(file =>
                file.selected_files.map(fileSelected => (
                    <Box
                        key={`file-selected-${fileSelected.id}`}
                        className='chat-box__chip'
                        data-testid={`file-chip-${fileSelected.id}`}
                        onClick={e => handleClickFileChip(e, fileSelected)}>
                        <span className={getMidiaByExtensao(fileSelected.tipo_midia)?.icon} />
                        <Box className='chat-box__arquivo-pasta'>
                            <label
                                htmlFor='input'
                                className='chat-box__float-label'>
                                {file.folder_name}
                            </label>
                            <input
                                type='text'
                                id='input'
                            />
                            <Tooltip
                                key={`file-tooltip-${fileSelected.id}`}
                                placement='top-end'
                                title={fileSelected.nome}
                                arrow>
                                <span className='chat-box__chip-item'>{capitalizeFirstLetter(fileSelected.nome)}</span>
                            </Tooltip>
                        </Box>
                        <Box className='chat-box__chip-itens'>
                            <Chip
                                className='chat-box__chip-delete'
                                size='medium'
                                data-testid={`file-delete-${fileSelected.id}`}
                                onDelete={() => handleUnselectFile(fileSelected)}
                                deleteIcon={<Close />}
                            />
                        </Box>
                    </Box>
                ))
            )}

            {showClearButton && (
                <Tooltip title='Limpar tudo'>
                    <IconButton
                        onClick={buttonClearAllFiles}
                        className='chat-box__chip-container__limpar-tudo'
                        data-testid='clear-all-button'
                        aria-label='Limpar tudo'>
                        <Close />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    )
}

export default InputFiles
