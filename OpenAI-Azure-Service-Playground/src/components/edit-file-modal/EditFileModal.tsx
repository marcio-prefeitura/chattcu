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

import { IFile } from '../../shared/interfaces/Folder'

import './EditFileModal.scss'

interface EditFileModalProps {
    openModalEditFile: boolean
    file: any | null
    handleOpenModal: (openModal: boolean) => void
    handleEditFile: (file: IFile) => Promise<boolean>
}

const EditFileModal: React.FC<EditFileModalProps> = ({ openModalEditFile, file, handleEditFile, handleOpenModal }) => {
    const [isInputChange, setIsInputChange] = useState(false)
    const [editedTitle, setEditedTitle] = useState<string>('')
    const [initialTitle, setInitialTitle] = useState<string>('')

    const handleClose = () => {
        handleOpenModal(false)
    }

    const handleEditTitle = async (file: IFile) => {
        const retorno = await handleEditFile(file)
        if (retorno) {
            setEditedTitle(file.nome)
            setInitialTitle(file.nome)
        } else {
            file.nome = initialTitle
            setEditedTitle(initialTitle)
        }
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
        if (openModalEditFile && file) {
            setEditedTitle(file.nome || '')
            setInitialTitle(file.nome || '')
        }
    }, [openModalEditFile, file])

    if (!file) {
        return null
    }

    return (
        <div>
            <Modal
                open={openModalEditFile}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500
                }}>
                <Fade in={openModalEditFile}>
                    <div className='edit-modal'>
                        <Box className='edit-modal__box-icone-texto'>
                            <div className='edit-modal__icone-close'>
                                <span className='icon-edit' />
                                <div className='edit-modal__texto'>
                                    <Typography
                                        className='edit-modal__titulo'
                                        gutterBottom>
                                        Renomear Documento
                                    </Typography>
                                    <DialogContent className='edit-modal__box'>
                                        <DialogContentText
                                            id='alert-dialog-description'
                                            className='edit-modal__box--text'>
                                            Digite o novo nome do documento
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
                                setIsInputChange(newTitle !== (file ? file.nome : ''))
                            }}
                            onBlur={() => {
                                setEditedTitle(editedTitle || '')
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
                                onClick={async () => {
                                    if (isTitleValid(editedTitle || '') && isTitleTrimmedValid(editedTitle || '')) {
                                        file.nome = editedTitle
                                        await handleEditTitle(file)
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

export default EditFileModal
