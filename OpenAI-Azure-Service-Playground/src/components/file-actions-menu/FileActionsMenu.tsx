import React, { useEffect, useRef, useState } from 'react'

import { Box, Divider, Menu, MenuItem, Typography } from '@mui/material'
import IconButton from '@mui/material/IconButton'
// import MoreVertIcon from '@mui/icons-material/MoreVert'

import { IFile, IFolder } from '../../shared/interfaces/Folder'
import { getMidiaByExtensao, MidiasAceitasEnum } from '../../utils/enum/MidiasAceitasEnum'
import { IUserInfo } from '../../hooks/useUserInfo'
import useAlert from '../../utils/AlertUtils'
import CopyFileModal from '../copy-file-modal/CopyFileModal'
import DeleteFileModel from '../delete-file-modal/DeleteFileModel'
import EditFileModal from '../edit-file-modal/EditFileModal'
import MessageToastGroup from '../message-toast-group/MessageToastGroup'
import MoveFileModal from '../move-file-modal/MoveFileModal'
import If from '../operator/if'
import PropertiesDialog from './PropertiesDialog'

import './FileActionsMenu.scss'
import '../../assets/icons/style.css'

interface FileActionMenuProps {
    file: any | null
    filteredFolder: any[]
    handleEditFile: (file: IFile) => Promise<boolean>
    handleDeleteFile: (folderId: string, file: string) => void
    handleCopiedFile: (file: IFile[], oldFolderUpdated: IFolder, mensagem: string) => void
    handleMovedFile: (file: any, oldFile: any, mensagem: string) => void
    handleDownloadFile: (file: any) => Promise<void>
    profile?: IUserInfo
}

const FileActionsMenu: React.FC<FileActionMenuProps> = ({
    file,
    filteredFolder,
    handleEditFile,
    handleDeleteFile,
    handleDownloadFile,
    handleCopiedFile,
    handleMovedFile,
    profile
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const [isOpenModalEditFile, setIsOpenModalEditFile] = useState<boolean>(false)
    const [isOpenModalDeleteFile, setIsOpenModalDeleteFile] = useState<boolean>(false)
    const [isOpenModalCopyFile, setIsOpenModalCopyFile] = useState<boolean>(false)
    const [isOpenModalMoveFile, setIsOpenModalMoveFile] = useState<boolean>(false)

    const [copyShowError, setShowCopyError] = useState<boolean>(false)
    const [copyErrorMessage, setCopyErrorMessage] = useState<any[]>([])
    const [copyShowSucess, setShowCopySuccess] = useState<boolean>(false)
    const [copySucessMessage] = useState<string>('')

    const [moveShowError, setShowMoveError] = useState<boolean>(false)
    const [moveErrorMessage, setMoveErrorMessage] = useState<any[]>([])
    const [moveShowSucess, setShowMoveSuccess] = useState<boolean>(false)
    const [moveSucessMessage] = useState<string>('')

    const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false)

    const [hiddenFolder, setHiddenFolder] = useState<string>('')

    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const { handleAlert } = useAlert()

    // Usado para posicionar o menu.
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleDownloadMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setDownloadAnchorEl(event.currentTarget)
    }

    // Limpa o target do menu.
    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleDownloadMenuClose = () => {
        setDownloadAnchorEl(null)
    }

    const openModalEditFile = () => {
        setIsOpenModalEditFile(true)
        setAnchorEl(null)
    }

    const openModalDeleteFile = () => {
        setIsOpenModalDeleteFile(true)
        setAnchorEl(null)
    }

    const handleDeleteAndCloseModal = () => {
        if (file) {
            handleDeleteFile(file.id_pasta_pai, file.id)
            setIsOpenModalDeleteFile(false)
        }
    }

    const handleDownload = async () => {
        handleMenuClose()
        if (file) {
            setIsDownloading(true)
            handleAlert('info', 'Inicio Download', 0)

            try {
                await handleDownloadFile(file)
                handleAlert('success', 'Download complete', 6000)
            } catch (error) {
                console.error('Download failed:', error)
                handleAlert('error', 'Download failed', 6000)
            } finally {
                setIsDownloading(false)
            }
        }
    }

    const openModalCopyFile = (folderId: string) => {
        setHiddenFolder(folderId)
        setIsOpenModalCopyFile(true)
        setAnchorEl(null)
    }

    const openModalMoveFile = (folderId: string) => {
        setHiddenFolder(folderId)
        setIsOpenModalMoveFile(true)
        setAnchorEl(null)
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
            // setIconColor('white')
        }
    }

    const onCopyFile = async (data: any | boolean, oldFolderUpdated: IFolder) => {
        const { mensagem, itens, itens_com_erros } = data

        if (itens_com_erros.length > 0) {
            setCopyErrorMessage(itens_com_erros)
            setShowCopyError(true)
            return
        }

        handleCopiedFile(itens, oldFolderUpdated, mensagem)
    }

    const onMoveFile = (data: any | boolean, oldFile: any) => {
        const { mensagem, itens, itens_com_erros } = data

        if (itens_com_erros.length > 0) {
            setMoveErrorMessage(itens_com_erros)
            setShowMoveError(true)
        }

        itens.forEach((item: any) => {
            handleMovedFile(item, oldFile, mensagem)
        })
    }

    useEffect(() => {
        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    if (!file) {
        return null
    }
    return (
        <Box className='file-actions'>
            <IconButton
                className='file-actions__tres-pontos-upload'
                data-testid={`file-action-menu-3-dots-${file.id}`}
                size='small'
                aria-controls={`menu-${file}`}
                aria-haspopup='true'
                onClick={handleMenuClick}>
                <span className='icon-more-vertical' />
            </IconButton>
            <EditFileModal
                openModalEditFile={isOpenModalEditFile}
                file={file}
                handleOpenModal={setIsOpenModalEditFile}
                handleEditFile={handleEditFile}
            />
            <DeleteFileModel
                openModalDeleteFile={isOpenModalDeleteFile}
                file={file}
                handleOpenModal={setIsOpenModalDeleteFile}
                handleDeleteFile={handleDeleteAndCloseModal}
            />
            <CopyFileModal
                hiddenFolder={hiddenFolder}
                openModalCopyFile={isOpenModalCopyFile}
                file={file}
                filteredFolder={filteredFolder}
                handleOpenModal={setIsOpenModalCopyFile}
                onCopyFile={onCopyFile}
            />
            <MoveFileModal
                openModalMoveFile={isOpenModalMoveFile}
                hiddenFolder={hiddenFolder}
                file={file}
                filteredFolder={filteredFolder}
                handleOpenModal={setIsOpenModalMoveFile}
                onMoveFile={onMoveFile}
            />
            <Menu
                className='file-actions__menu'
                id={`menu-${file}`}
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}>
                <div>
                    <MenuItem
                        onClick={() => openModalEditFile()}
                        data-testid={'edit-button-1'}
                        className='file-actions__icone-editar'>
                        <Box className='file-actions__limpar-conversa'>
                            <span className='icon-edit' />
                            <Typography className='file-actions__texto'>Renomear</Typography>
                        </Box>
                    </MenuItem>
                    <Divider variant='middle' />
                </div>
                <MenuItem
                    onClick={handleDownload}
                    data-testid={`share-chat-button-${file}`}
                    className='file-actions__icone-share-chat'>
                    <Box className='file-actions__limpar-conversa'>
                        <span className='icon-download' />
                        <Typography className='file-actions__texto'>Baixar</Typography>
                    </Box>
                </MenuItem>
                <Divider variant='middle' />
                {
                    <If test={MidiasAceitasEnum.LINK === getMidiaByExtensao(file.tipo_midia)}>
                        <MenuItem
                            onClick={handleDownloadMenuClick}
                            data-testid={`download-button-${file}`}
                            className='file-actions__icone-share-chat'>
                            <Box className='file-actions__limpar-conversa'>
                                <div className='icon-download' />
                                <Typography className='file-actions__texto'>Baixar</Typography>
                                <div className='icon-chevron-right' />
                            </Box>
                        </MenuItem>
                        <Menu
                            className='file-actions__submenu'
                            id={`download-submenu-${file}`}
                            anchorEl={downloadAnchorEl}
                            keepMounted
                            open={Boolean(downloadAnchorEl)}
                            onClose={handleDownloadMenuClose}>
                            <MenuItem
                                onClick={handleDownload}
                                data-testid={`download1-button-${file}`}
                                className='file-actions__icone-share-chat'>
                                <Box className='file-actions__limpar-conversa'>
                                    <span className='icon-download' />
                                    <Typography className='file-actions__texto'>Baixar arquivo</Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem
                                onClick={handleDownload}
                                data-testid={`download2-button-${file}`}
                                className='file-actions__icone-share-chat'>
                                <Box className='file-actions__limpar-conversa'>
                                    <span className='icon-download' />
                                    <Typography className='file-actions__texto'>Baixar relatório</Typography>
                                </Box>
                            </MenuItem>
                        </Menu>
                        <Divider variant='middle' />
                    </If>
                }
                {filteredFolder.length > 1 && (
                    <div>
                        <MenuItem
                            onClick={() => openModalCopyFile(file.id_pasta_pai)}
                            data-testid={`copy-button-${file}`}
                            className='file-actions__icone-share-chat'>
                            <Box className='file-actions__limpar-conversa'>
                                <span className='icon-copy' />
                                <Typography className='file-actions__texto'>Copiar</Typography>
                            </Box>
                        </MenuItem>
                        <Divider variant='middle' />
                    </div>
                )}
                {filteredFolder.length > 1 && (
                    <div>
                        <MenuItem
                            onClick={() => openModalMoveFile(file.id_pasta_pai)}
                            data-testid={`move-button-${file}`}
                            className='file-actions__icone-share-chat'>
                            <Box className='file-actions__limpar-conversa'>
                                <span className='icon-move' />
                                <Typography className='file-actions__texto'>Mover</Typography>
                            </Box>
                        </MenuItem>
                        <Divider variant='middle' />
                    </div>
                )}
                <MenuItem
                    onClick={() => openModalDeleteFile()}
                    data-testid={`file-delete-button-${file.id}`}
                    className='file-actions__icone-deletar'>
                    <Box className='file-actions__limpar-conversa'>
                        <span
                            className='icon-trash'
                            aria-hidden='true'
                        />
                        <Typography className='file-actions__texto'>Excluir</Typography>
                    </Box>
                </MenuItem>

                <If test={profile?.perfilDev}>
                    <MenuItem
                        onClick={() => {
                            handleMenuClose()
                            setIsPropertiesDialogOpen(true)
                        }}
                        data-testid={`properties-button-${file}`}
                        className='file-actions__icone-share-chat'>
                        <Box className='file-actions__limpar-conversa'>
                            <span className='icon-settings' />
                            <Typography className='file-actions__texto'>Informações</Typography>
                        </Box>
                    </MenuItem>
                </If>
            </Menu>

            <If test={profile?.perfilDev}>
                <PropertiesDialog
                    open={isPropertiesDialogOpen}
                    onClose={() => setIsPropertiesDialogOpen(false)}
                    file={file}
                />
            </If>
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
                setMoveShowError={setShowMoveError}
            />
        </Box>
    )
}

export default FileActionsMenu
