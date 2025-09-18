import React from 'react'

import { Backdrop, Box, Button, Fade, IconButton, Modal, Typography } from '@mui/material'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import './DeleteSelectedFilesModal.scss'

interface DeleteSelectedFilesModalProps {
    openModalDeleteFile: boolean
    folder: any | null
    handleOpenModal: (openModal: boolean) => void
    handleDeleteFile: (fileId: string) => void
}

const DeleteSelectedFilesModal: React.FC<DeleteSelectedFilesModalProps> = ({
    openModalDeleteFile,
    folder,
    handleDeleteFile,
    handleOpenModal
}) => {
    const handleClose = () => {
        handleOpenModal(false)
    }

    if (!folder) {
        return null
    }
    return (
        <div>
            <Modal
                open={openModalDeleteFile}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500
                }}>
                <Fade in={openModalDeleteFile}>
                    <Box className='delete-modal'>
                        <Box className='delete-modal__box-icone-texto'>
                            <div className='delete-modal__icone-close'>
                                <span className='icon-trash' />
                                <div className='delete-modal__texto'>
                                    <Typography
                                        className='delete-modal__titulo'
                                        gutterBottom>
                                        Excluir documentos selecionados
                                    </Typography>

                                    <DialogContent className='delete-modal__box'>
                                        <DialogContentText
                                            id='alert-dialog-description'
                                            className='delete-modal__box--text'>
                                            Deseja excluir os documentos selecionados?
                                        </DialogContentText>
                                    </DialogContent>
                                </div>
                                <IconButton
                                    aria-label=''
                                    onClick={handleClose}>
                                    <span className='icon-x' />
                                </IconButton>
                            </div>

                            <div className='delete-modal__botao'>
                                <Button
                                    variant='outlined'
                                    size='medium'
                                    disableElevation
                                    onClick={handleClose}
                                    className='delete-modal__botao--cancelar'>
                                    Cancelar
                                </Button>
                                <Button
                                    variant='contained'
                                    size='medium'
                                    disableElevation
                                    color='primary'
                                    onClick={() => handleDeleteFile(folder)}
                                    className='delete-modal__botao--confirmar'>
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

export default DeleteSelectedFilesModal
