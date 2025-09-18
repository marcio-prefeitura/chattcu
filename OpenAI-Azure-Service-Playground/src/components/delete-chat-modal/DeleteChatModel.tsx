import React from 'react'

import { Backdrop, Box, Button, Fade, IconButton, Modal, Typography } from '@mui/material'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import { IChat } from '../../infrastructure/utils/types'

import './DeleteChatModal.scss'

interface DeleteChatModalProps {
    openModalDeleteChat: boolean
    chat: IChat | null
    handleOpenModal: (openModal: boolean) => void
    handleDeleteChat: (chatToEdit: IChat) => void
}

const DeleteChatModel: React.FC<DeleteChatModalProps> = ({
    openModalDeleteChat,
    chat,
    handleDeleteChat,
    handleOpenModal
}) => {
    const handleClose = () => {
        handleOpenModal(false)
    }

    if (!chat) {
        return null
    }
    return (
        <div>
            <Modal
                open={openModalDeleteChat}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500
                }}>
                <Fade in={openModalDeleteChat}>
                    <div className='delete-modal'>
                        <Box className='delete-modal__box-icone-texto'>
                            <Box className='delete-modal__icone-close'>
                                <span className='icon-trash' />
                                <Box className='delete-modal__texto'>
                                    <Typography
                                        className='delete-modal__titulo'
                                        gutterBottom>
                                        Excluir Chat
                                    </Typography>

                                    <DialogContent className='delete-modal__box'>
                                        <DialogContentText
                                            id='alert-dialog-description'
                                            className='delete-modal__box--text'>
                                            <p>
                                                Tem certeza que deseja excluir o chat: <b>&apos;{chat.titulo}&apos;</b>
                                            </p>
                                            <small>
                                                Ao excluir este chat, caso haja compartilhamento, o link será revogado.
                                            </small>
                                        </DialogContentText>
                                    </DialogContent>
                                </Box>
                                <IconButton
                                    aria-label=''
                                    onClick={handleClose}>
                                    <span className='icon-x' />
                                </IconButton>
                            </Box>

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
                                    data-testid='confirm-delete-button'
                                    variant='contained'
                                    size='medium'
                                    disableElevation
                                    color='primary'
                                    onClick={() => handleDeleteChat(chat)}
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

export default DeleteChatModel
