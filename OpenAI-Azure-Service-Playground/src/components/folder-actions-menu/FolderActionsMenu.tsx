import React, { useEffect, useRef, useState } from 'react'

import { Box, Divider, Menu, MenuItem, Typography } from '@mui/material'
import IconButton from '@mui/material/IconButton'
// import MoreVertIcon from '@mui/icons-material/MoreVert'

import { IFile, IFolder } from '../../shared/interfaces/Folder'
import useAlert from '../../utils/AlertUtils'
import CopyFileModal from '../copy-file-modal/CopyFileModal'
import DeleteFolderModel from '../delete-folder-modal/DeleteFolderModel'
import DeleteSelectedFilesModal from '../delete-selected-files-modal/DeleteSelectedFilesModal'
import EditFolderModal from '../edit-folder-modal/EditFolderModal'
import MessageToastGroup from '../message-toast-group/MessageToastGroup'
import MoveFileModal from '../move-file-modal/MoveFileModal'

import './FolderActionsMenu.scss'
import '../../assets/icons/style.css'

export interface MoveCopyFilesApiResponse {
    itens: any[]
    itens_com_erros: any[]
    mensagem: string
    status: number
}

interface FolderActionsMenuProps {
    folder: any | null
    filteredFolder: any[]
    handleCopiedFile: (file: IFile[], oldFolderUpdated: IFolder, mensagem: string) => void
    handleMovedFileBulk: (files: any[], selectedFolder: string, oldFolderUpdated: IFolder, mensagem: string) => void
    handleEditFolder: (folder: any) => Promise<boolean>
    handleDeleteFiles: (folder: any) => void
    handleDeleteFolder: (folderId: string) => void
    handleDownloadFolder: (folder: any) => Promise<void>
}

const FolderActionsMenu: React.FC<FolderActionsMenuProps> = ({
    folder,
    filteredFolder,
    handleEditFolder,
    handleDeleteFolder,
    handleDeleteFiles,
    handleDownloadFolder,
    handleCopiedFile,
    handleMovedFileBulk
}) => {
    const hasSelectedFiles = folder?.arquivos?.some((f: any) => f.selected) || false
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [iconColor, setIconColor] = useState('black') // Estado para controlar a cor do ícone
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const [isOpenModalEditFolder, setIsOpenModalEditFolder] = useState<boolean>(false)
    const [isOpenModalDeleteFolder, setIsOpenModalDeleteFolder] = useState<boolean>(false)

    const [isOpenModalDeleteFile, setIsOpenModalDeleteFile] = useState<boolean>(false)
    const [isOpenModalCopyFile, setIsOpenModalCopyFile] = useState<boolean>(false)
    const [isOpenModalMoveFile, setIsOpenModalMoveFile] = useState<boolean>(false)

    const [copyShowError, setShowCopyError] = useState<boolean>(false)
    const [copyErrorMessage, setCopyErrorMessage] = useState<any[]>([])
    const [copyShowSucess, setShowCopySuccess] = useState<boolean>(false)
    const [copySucessMessage] = useState<string>('')

    const [moveShowError, setMoveShowError] = useState<boolean>(false)
    const [moveErrorMessage, setMoveErrorMessage] = useState<any[]>([])
    const [moveShowSucess, setShowMoveSuccess] = useState<boolean>(false)
    const [moveSucessMessage] = useState<string>('')

    const [hiddenFolder, setHiddenFolder] = useState<string>('')

    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const { handleAlert } = useAlert()

    // Verifica se a pasta é "Arquivos Gerais" e está vazia
    const isGeneralFolderEmpty =
        folder && folder.nome === 'Arquivos gerais' && (!folder.arquivos || folder.arquivos.length === 0)

    // Usado para posicionar o menu.
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    // Limpa o target do menu.
    const handleMenuClose = () => {
        setAnchorEl(null)
    }
    const openModalEditFolder = () => {
        setIsOpenModalEditFolder(true)
        setAnchorEl(null)
    }

    const openModalDeleteFolder = () => {
        setIsOpenModalDeleteFolder(true)
        setAnchorEl(null)
    }

    const handleDeleteAndCloseModal = () => {
        if (folder) {
            handleDeleteFolder(folder.id)
            setIsOpenModalDeleteFolder(false) // Feche o modal após a exclusão
        }
    }

    const handleDeleteAndCloseModalFiles = folderInput => {
        if (folder) {
            const selectedFiles = folder.arquivos.filter((f: any) => f.selected)

            // Sem arquivos selecionados, retornamos.
            if (selectedFiles.length === 0) {
                return
            }

            handleDeleteFiles(folderInput)
            setIsOpenModalDeleteFile(false) // Feche o modal após a exclusão
        }
    }

    const handleDownload = async () => {
        handleMenuClose()
        if (folder) {
            setIsDownloading(true)

            try {
                await handleDownloadFolder(folder)
                handleAlert('success', 'Download complete', 6000)
            } catch (error) {
                console.error('Download failed:', error)
                handleAlert('error', 'Download failed', 6000)
            } finally {
                setIsDownloading(false)
            }
            handleMenuClose()
        }
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
            setIconColor('white') // Volta à cor branca ao clicar fora do botão
        }
    }

    const openModalCopyFile = (folderId: string) => {
        const selectedFiles = folder.arquivos.filter((f: any) => f.selected)

        setHiddenFolder(folderId)

        if (selectedFiles.length === 0) {
            setAnchorEl(null)
            return
        }

        setIsOpenModalCopyFile(true)
        setAnchorEl(null)
    }

    const openModalDeleteFile = () => {
        const selectedFiles = folder.arquivos.filter((f: any) => f.selected)

        if (selectedFiles.length === 0) {
            setAnchorEl(null)
            return
        }
        setIsOpenModalDeleteFile(true)
        setAnchorEl(null)
    }

    const openModalMoveFile = (folderId: string) => {
        const selectedFiles = folder.arquivos.filter((f: any) => f.selected)

        setHiddenFolder(folderId)

        if (selectedFiles.length === 0) {
            setAnchorEl(null)
        } else {
            setIsOpenModalMoveFile(true)
            setAnchorEl(null)
        }
    }

    const onCopyFile = async (data: any | boolean, oldFolderUpdated: IFolder) => {
        const { mensagem, itens, itens_com_erros } = data

        if (itens_com_erros.length > 0) {
            setCopyErrorMessage(itens_com_erros)
            setShowCopyError(true)
        }

        handleCopiedFile(itens, oldFolderUpdated, mensagem)
    }

    const onMoveFile = (data: MoveCopyFilesApiResponse, selectedFolder: string, oldFolderUpdated: IFolder) => {
        const { mensagem, itens, itens_com_erros } = data

        if (itens_com_erros.length > 0) {
            setMoveErrorMessage(itens_com_erros)
            setMoveShowError(true)
        }

        handleMovedFileBulk(itens, selectedFolder, oldFolderUpdated, mensagem)
    }

    useEffect(() => {
        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [iconColor])

    if (!folder) {
        return null
    }

    return (
        <Box className='folder-actions'>
            <IconButton
                className='folder-actions__tres-pontos-upload'
                size='small'
                aria-controls={`menu-${folder.id}`}
                aria-haspopup='true'
                onClick={handleMenuClick}
                data-testid={`folder-action-menu-3-dots-${folder.id}`}>
                <span className='icon-more-vertical' />
            </IconButton>
            <EditFolderModal
                openModalEditFolder={isOpenModalEditFolder}
                folder={folder}
                handleOpenModal={setIsOpenModalEditFolder}
                handleEditFolder={handleEditFolder}
            />
            <DeleteFolderModel
                openModalDeleteFolder={isOpenModalDeleteFolder}
                folder={folder}
                handleOpenModal={setIsOpenModalDeleteFolder}
                handleDeleteFolder={handleDeleteAndCloseModal}
            />
            <DeleteSelectedFilesModal
                openModalDeleteFile={isOpenModalDeleteFile}
                folder={folder}
                handleOpenModal={setIsOpenModalDeleteFile}
                handleDeleteFile={handleDeleteAndCloseModalFiles}
            />
            <CopyFileModal
                openModalCopyFile={isOpenModalCopyFile}
                hiddenFolder={hiddenFolder}
                file={folder}
                filteredFolder={filteredFolder}
                handleOpenModal={setIsOpenModalCopyFile}
                onCopyFile={onCopyFile}
            />
            <MoveFileModal
                openModalMoveFile={isOpenModalMoveFile}
                hiddenFolder={hiddenFolder}
                file={folder}
                filteredFolder={filteredFolder}
                handleOpenModal={setIsOpenModalMoveFile}
                onMoveFile={onMoveFile}
            />
            <Menu
                className='folder-actions__menu'
                id={`menu-${folder}`}
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}>
                {folder.id !== -1 && (
                    <div>
                        <MenuItem
                            onClick={() => openModalEditFolder()}
                            data-testid={`edit-button-${folder.id}`}
                            className='folder-actions__icone-editar'>
                            <Box className='folder-actions__limpar-conversa'>
                                <span className='icon-edit' />
                                <Typography className='folder-actions__texto'>Renomear</Typography>
                            </Box>
                        </MenuItem>
                        <Divider variant='middle' />
                    </div>
                )}
                {folder.arquivos && folder.arquivos.length ? (
                    <div>
                        <MenuItem
                            onClick={handleDownload}
                            data-testid={`download-button-${folder.id}`}
                            className='folder-actions__icone-share-chat'>
                            <Box className='folder-actions__limpar-conversa'>
                                <span className='icon-download' />
                                <Typography className='folder-actions__texto'>Baixar</Typography>
                            </Box>
                        </MenuItem>
                        <Divider variant='middle' />
                    </div>
                ) : (
                    ''
                )}
                {filteredFolder.length > 1 && folder.arquivos && folder.arquivos.length > 0 ? (
                    <div>
                        <MenuItem
                            onClick={() => openModalCopyFile(folder.id)}
                            disabled={!hasSelectedFiles}
                            data-testid={`copy-button-folder-${folder.id}`}
                            className='folder-actions__icone-share-chat'>
                            <Box className='folder-actions__limpar-conversa'>
                                <span className='icon-copy' />
                                <Typography className='folder-actions__texto'>Copiar selecionados</Typography>
                            </Box>
                        </MenuItem>
                        <Divider variant='middle' />
                    </div>
                ) : (
                    ''
                )}
                {filteredFolder.length > 1 && folder.arquivos && folder.arquivos.length > 0 ? (
                    <div>
                        <MenuItem
                            onClick={() => openModalMoveFile(folder.id)}
                            disabled={!hasSelectedFiles}
                            data-testid={`move-button-folder-${folder.id}`}
                            className='folder-actions__icone-share-chat'>
                            <Box className='folder-actions__limpar-conversa'>
                                <span className='icon-move' />
                                <Typography className='folder-actions__texto'>Mover selecionados</Typography>
                            </Box>
                        </MenuItem>
                        <Divider variant='middle' />
                    </div>
                ) : (
                    ''
                )}

                {folder.arquivos && folder.arquivos.length > 0 ? (
                    <div>
                        <MenuItem
                            onClick={openModalDeleteFile}
                            disabled={!hasSelectedFiles}
                            data-testid={`delete-files-button-${folder.id}`}
                            className='folder-actions__icone-deletar'>
                            <Box className='folder-actions__limpar-conversa'>
                                <span
                                    className='icon-trash'
                                    aria-hidden='true'
                                />
                                <Typography className='folder-actions__texto'>Excluir selecionados</Typography>
                            </Box>
                        </MenuItem>
                        <Divider variant='middle' />
                    </div>
                ) : (
                    ''
                )}

                {folder.id !== -1 && (
                    <div>
                        <MenuItem
                            onClick={() => openModalDeleteFolder()}
                            data-testid={`delete-button-${folder.id}`}
                            className='folder-actions__icone-deletar'>
                            <Box className='folder-actions__limpar-conversa'>
                                <span
                                    className='icon-trash'
                                    aria-hidden='true'
                                />
                                <Typography className='folder-actions__texto'>Excluir pasta</Typography>
                            </Box>
                        </MenuItem>
                    </div>
                )}

                {isGeneralFolderEmpty && (
                    <MenuItem disabled>
                        <Typography className='folder-actions__texto'>A pasta Arquivos gerais está vazia</Typography>
                    </MenuItem>
                )}
            </Menu>
            <MessageToastGroup
                isDownloading={isDownloading}
                copyShowSucess={copyShowSucess}
                copySucessMessage={copySucessMessage}
                copyShowError={copyShowError}
                copyErrorMessage={copyErrorMessage}
                moveShowSucess={moveShowSucess}
                moveSucessMessage={moveSucessMessage}
                moveShowError={moveShowError}
                moveErrorMessage={moveErrorMessage}
                setIsDownloading={setIsDownloading}
                setShowCopySuccess={setShowCopySuccess}
                setShowCopyError={setShowCopyError}
                setShowMoveSuccess={setShowMoveSuccess}
                setMoveShowError={setMoveShowError}
            />
        </Box>
    )
}

export default FolderActionsMenu
