import {
    Backdrop,
    Box,
    Button,
    DialogContent,
    DialogContentText,
    Fade,
    IconButton,
    Modal,
    TextField,
    Typography
} from '@mui/material'
import React, { useState, useEffect } from 'react'

import { IChat } from '../../infrastructure/utils/types'

import './EditChatModal.scss'

interface EditChatModalProps {
    openModalEditChat: boolean
    chat: IChat | null
    handleOpenModal: (openModal: boolean) => void
    handleEditChat: (chatToEdit: IChat) => void
    handleInputChange: (chatId: string, newTitle: string) => void
}

const EditChatModal: React.FC<EditChatModalProps> = ({ openModalEditChat, chat, handleEditChat, handleOpenModal }) => {
    const [isInputChange, setIsInputChange] = useState(false)
    const [editedTitle, setEditedTitle] = useState<string>('')

    const handleClose = () => {
        handleOpenModal(false)
    }

    const handleEditTitle = (chat: IChat) => {
        handleEditChat(chat)
        handleClose()
    }

    const isTitleValid = (title: string) => {
        const trimmedTitle = title.trim()
        return trimmedTitle !== ''
    }

    const isTitleTrimmedValid = (title: string) => {
        const trimmedTitle = title.trim()
        return trimmedTitle === title
    }

    useEffect(() => {
        if (openModalEditChat && chat) {
            setEditedTitle(chat.titulo || '')
        }
    }, [openModalEditChat, chat])

    if (!chat) {
        return null
    }

    return (
        <div>
            <Modal
                open={openModalEditChat}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500
                }}>
                <Fade in={openModalEditChat}>
                    <div className='edit-modal'>
                        <Box className='edit-modal__box-icone-texto'>
                            <div className='edit-modal__icone-close'>
                                <span className='icon-edit' />
                                <div className='edit-modal__texto'>
                                    <Typography
                                        className='edit-modal__titulo'
                                        gutterBottom>
                                        Renomear chat
                                    </Typography>
                                    <DialogContent className='edit-modal__box'>
                                        <DialogContentText
                                            id='alert-dialog-description'
                                            className='edit-modal__box--text'>
                                            Digite o novo título do chat
                                        </DialogContentText>
                                    </DialogContent>
                                </div>
                                <IconButton
                                    aria-label=''
                                    onClick={handleClose}>
                                    <span className='icon-x' />
                                </IconButton>
                            </div>
                        </Box>
                        <TextField
                            className='edit-modal__textfield'
                            value={editedTitle}
                            onChange={e => {
                                const newTitle = e.target.value
                                setEditedTitle(newTitle)
                                setIsInputChange(newTitle !== (chat ? chat.titulo : ''))
                            }}
                        />
                        <div className='edit-modal__botao'>
                            <Button
                                variant='outlined'
                                size='medium'
                                disableElevation
                                onClick={handleClose}
                                className='edit-modal__botao--cancelar'>
                                Cancelar
                            </Button>
                            <Button
                                variant='contained'
                                size='medium'
                                color='primary'
                                disableElevation
                                disabled={
                                    !isInputChange ||
                                    !isTitleValid(editedTitle || '') ||
                                    !isTitleTrimmedValid(editedTitle || '')
                                }
                                onClick={() => {
                                    if (isTitleValid(editedTitle || '') && isTitleTrimmedValid(editedTitle || '')) {
                                        chat.titulo = editedTitle
                                        handleEditTitle(chat)
                                    }
                                }}
                                className={
                                    !isTitleValid(editedTitle || '') ||
                                    !isInputChange ||
                                    !isTitleTrimmedValid(editedTitle || '')
                                        ? 'edit-modal__botao--confirmar disabled'
                                        : 'edit-modal__botao--confirmar'
                                }>
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </Fade>
            </Modal>
        </div>
    )
}

export default EditChatModal
