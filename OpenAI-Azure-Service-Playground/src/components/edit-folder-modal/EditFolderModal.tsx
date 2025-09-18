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

import { IFolder } from '../../shared/interfaces/Folder'

import './EditFolderModal.scss'

interface EditFileModalProps {
    openModalEditFolder: boolean
    folder: any | null
    handleOpenModal: (openModal: boolean) => void
    handleEditFolder: (folder: IFolder) => Promise<boolean>
}

const MAX_TITLE_LENGTH = 40

const EditFolderModal: React.FC<EditFileModalProps> = ({
    openModalEditFolder,
    folder,
    handleEditFolder,
    handleOpenModal
}) => {
    const [isInputChange, setIsInputChange] = useState(false)
    const [editedTitle, setEditedTitle] = useState<string>('')
    const [initialTitle, setInitialTitle] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')

    const handleClose = () => {
        handleOpenModal(false)
    }

    const handleEditTitle = async (folder: IFolder) => {
        const retorno = await handleEditFolder(folder)
        if (retorno) {
            setEditedTitle(folder.nome)
            setInitialTitle(folder.nome)
        } else {
            folder.nome = initialTitle
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

    const isTitleLengthValid = (title: string) => {
        return title.length <= MAX_TITLE_LENGTH
    }

    const isButtonDisabled = () => {
        return (
            !isInputChange ||
            !isTitleValid(editedTitle || '') ||
            !isTitleLengthValid(editedTitle || '') ||
            !isTitleTrimmedValid(editedTitle || '') ||
            editedTitle === (folder ? folder.nome : '')
        )
    }

    const getButtonClassName = () => {
        const baseClassName = 'edit-modal__botao--confirmar'
        if (isButtonDisabled()) {
            return `${baseClassName} disabled`
        }
        return baseClassName
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setEditedTitle(newTitle)

        if (newTitle.length === MAX_TITLE_LENGTH) {
            setErrorMessage(`Máximo permitido de ${MAX_TITLE_LENGTH} caracteres.`)
        } else {
            setErrorMessage('')
        }

        setIsInputChange(newTitle !== (folder ? folder.nome : ''))
    }

    useEffect(() => {
        if (openModalEditFolder && folder) {
            setEditedTitle(folder.nome || '')
            setInitialTitle(folder.nome || '')
        }
    }, [openModalEditFolder, folder])

    if (!folder) {
        return null
    }

    return (
        <div>
            <Modal
                open={openModalEditFolder}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500
                }}>
                <Fade in={openModalEditFolder}>
                    <div className='edit-modal'>
                        <Box className='edit-modal__box-icone-texto'>
                            <div className='edit-modal__icone-close'>
                                <span className='icon-edit' />
                                <div className='edit-modal__texto'>
                                    <Typography
                                        className='edit-modal__titulo'
                                        gutterBottom>
                                        Renomear Pasta
                                    </Typography>
                                    <DialogContent className='edit-modal__box'>
                                        <DialogContentText
                                            id='alert-dialog-description'
                                            className='edit-modal__box--text'>
                                            Digite o novo nome da pasta
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
                            onChange={handleTitleChange}
                            onBlur={() => setEditedTitle(editedTitle || '')}
                            helperText={errorMessage}
                            error={!!errorMessage}
                            inputProps={{
                                maxLength: MAX_TITLE_LENGTH
                            }}
                            sx={{
                                '& .MuiFormHelperText-root': {
                                    color: errorMessage ? '#E63737 !important' : 'inherit',
                                    margin: '8px 0'
                                },
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#E63737'
                                    }
                                }
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
                                disabled={isButtonDisabled()}
                                onClick={async () => {
                                    if (
                                        isTitleValid(editedTitle || '') &&
                                        isTitleTrimmedValid(editedTitle || '') &&
                                        isTitleLengthValid(editedTitle || '')
                                    ) {
                                        folder.nome = editedTitle
                                        await handleEditTitle(folder)
                                    }
                                }}
                                className={getButtonClassName()}>
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </Fade>
            </Modal>
        </div>
    )
}

export default EditFolderModal
