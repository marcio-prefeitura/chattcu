import React, { useEffect, useRef } from 'react'

import { Backdrop, Box, Button, Fade, IconButton, Modal, Typography } from '@mui/material'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import { capitalizeFirstLetter } from '../../shared/utils/Text'

import './DeleteFolderModal.scss'

interface DeleteFolderModalProps {
    openModalDeleteFolder: boolean
    folder: any | null
    handleOpenModal: (openModal: boolean) => void
    handleDeleteFolder: (folderId: string) => void
}

const DeleteFolderModel: React.FC<DeleteFolderModalProps> = ({
    openModalDeleteFolder,
    folder,
    handleDeleteFolder,
    handleOpenModal
}) => {
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    const handleClose = () => {
        handleOpenModal(false)
    }

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                handleDeleteFolder(folder.id)
                closeButtonRef.current?.focus()
            }
        }

        if (openModalDeleteFolder) {
            document.addEventListener('keydown', handleKeyPress)
        } else {
            document.removeEventListener('keydown', handleKeyPress)
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress)
        }
    }, [openModalDeleteFolder, folder.id, handleDeleteFolder])

    if (!folder) {
        return null
    }
    return (
        <div>
            <Modal
                open={openModalDeleteFolder}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500
                }}>
                <Fade in={openModalDeleteFolder}>
                    <Box className='delete-folder-modal'>
                        <Box className='delete-folder-modal__box-icone-texto'>
                            <div className='delete-folder-modal__icone-close'>
                                <span className='icon-trash' />
                                <div className='delete-folder-modal__texto'>
                                    <Typography
                                        className='delete-folder-modal__titulo'
                                        gutterBottom>
                                        Excluir pasta
                                    </Typography>

                                    <DialogContent className='delete-folder-modal__box'>
                                        <DialogContentText
                                            id='alert-dialog-description'
                                            className='delete-folder-modal__box--text'>
                                            Deseja excluir a pasta{' '}
                                            <b>&apos;{capitalizeFirstLetter(folder.nome)} &apos;</b>?
                                        </DialogContentText>
                                    </DialogContent>
                                </div>
                                <IconButton
                                    aria-label=''
                                    onClick={handleClose}>
                                    <span className='icon-x' />
                                </IconButton>
                            </div>

                            <div className='delete-folder-modal__botao'>
                                <Button
                                    variant='outlined'
                                    size='medium'
                                    disableElevation
                                    onClick={handleClose}
                                    className='delete-folder-modal__botao--cancelar'>
                                    Cancelar
                                </Button>
                                <Button
                                    variant='contained'
                                    size='medium'
                                    disableElevation
                                    color='primary'
                                    onClick={() => {
                                        handleDeleteFolder(folder.id)
                                        closeButtonRef.current?.focus() // Manter o foco no botão de fechar
                                    }}
                                    className='delete-folder-modal__botao--confirmar'>
                                    Confirmar
                                </Button>
                            </div>
                        </Box>
                    </Box>
                </Fade>
            </Modal>
        </div>
    )
}

export default DeleteFolderModel
