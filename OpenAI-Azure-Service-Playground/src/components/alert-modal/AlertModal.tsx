import React from 'react'

import { Box, IconButton } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

import './AlertModal.scss'

interface AlertModalProps {
    title: string
    message: string
    messageOk: string
    openModal: boolean
    showCancelButton: boolean
    onConfirmation: (status: boolean) => void
}

export const AlertModal: React.FC<AlertModalProps> = ({
    title,
    message,
    messageOk,
    openModal,
    showCancelButton,
    onConfirmation
}) => {
    return (
        <div>
            <Dialog
                open={openModal}
                className='alert-modal'
                aria-labelledby='alert-dialog-title'
                aria-describedby='alert-dialog-description'>
                <Box className='alert-modal__icon-title'>
                    <Box className='icon-converter-acordao'>
                        <span className='icon-share' />
                    </Box>
                    <Box>
                        <DialogTitle
                            id='alert-dialog-title'
                            className='alert-modal__titulo'>
                            {title}
                        </DialogTitle>
                        <DialogContent className='alert-modal__description'>
                            <DialogContentText
                                className='alert-modal__description'
                                id='alert-dialog-description'>
                                {message}
                            </DialogContentText>
                        </DialogContent>
                    </Box>
                    <IconButton
                        aria-label='Fechar'
                        onClick={() => onConfirmation(false)}>
                        <span className='icon-x' />
                    </IconButton>
                </Box>

                <DialogActions className='alert-modal__botao'>
                    {showCancelButton && (
                        <Button
                            variant='outlined'
                            size='medium'
                            disableElevation
                            onClick={() => onConfirmation(false)}
                            className='alert-modal__botao--cancelar'>
                            Cancelar
                        </Button>
                    )}
                    <Button
                        variant='contained'
                        size='medium'
                        disableElevation
                        color='primary'
                        onClick={() => onConfirmation(true)}
                        className='alert-modal__botao--confirmar'>
                        {messageOk}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
