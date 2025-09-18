import React from 'react'

import { Backdrop, Box, Button, Fade, IconButton, Modal, Typography } from '@mui/material'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import './DeleteFileModal.scss'

interface DeleteFileModalProps {
    openModalDeleteFile: boolean
    file: any | null
    handleOpenModal: (openModal: boolean) => void
    handleDeleteFile: (fileId: string) => void
}

const DeleteFileModel: React.FC<DeleteFileModalProps> = ({
    openModalDeleteFile,
    file,
    handleDeleteFile,
    handleOpenModal
}) => {
    const handleClose = () => {
        handleOpenModal(false)
    }

    if (!file) {
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
                    <div className='delete-modal'>
                        <Box className='delete-modal__box-icone-texto'>
                            <div className='delete-modal__icone-close'>
                                <span className='icon-trash' />
                                <div className='delete-modal__texto'>
                                    <Typography
                                        className='delete-modal__titulo'
                                        gutterBottom>
                                        Excluir documento
                                    </Typography>

                                    <DialogContent className='delete-modal__box'>
                                        <DialogContentText
                                            id='alert-dialog-description'
                                            className='delete-modal__box--text'>
                                            Deseja excluir o documento: <b>&apos;{file.nome}&apos;</b>?
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
                                    onClick={() => handleDeleteFile(file.id)}
                                    className='delete-modal__botao--confirmar'>
                                    Confirmar
                                </Button>
                            </div>
                        </Box>
                    </div>
                </Fade>
            </Modal>
        </div>
    )
}

export default DeleteFileModel
