import './AlertDialog.scss'
import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

interface AlertDialogProps {
    openModalDeleteFile: boolean
    handleOpenModal: (openModal: boolean) => void
    onConfirmation: () => void
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ openModalDeleteFile, handleOpenModal, onConfirmation }) => {
    const handleClose = () => {
        handleOpenModal(false)
    }

    return (
        <div>
            <Dialog
                open={openModalDeleteFile}
                onClose={handleClose}
                className='delete-arquivo'
                aria-labelledby='alert-dialog-title'
                aria-describedby='alert-dialog-description'>
                <DialogTitle
                    id='alert-dialog-title'
                    className='delete-arquivo__titulo'>
                    Confirma a exclusão do Arquivo?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText
                        id='alert-dialog-description'
                        className='delete-arquivo__description'>
                        Após a exclusão do arquivo não será mais possível sua utilização nas consultas dentro do chat.
                    </DialogContentText>
                </DialogContent>
                <DialogActions className='delete-arquivo__botao'>
                    <Button
                        onClick={handleClose}
                        className='delete-arquivo__botao--cancelar'>
                        Cancelar
                    </Button>
                    <Button
                        variant='text'
                        onClick={() => onConfirmation()}
                        className='delete-arquivo__botao--confirmar'>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
