import './DialogGeneric.scss'
import {
    Dialog,
    DialogTitle,
    DialogContentText,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography
} from '@mui/material'

interface IDialogGenericoProps {
    open: boolean
    onClose: () => void
    titulo: string
    conteudo: React.ReactNode
    icone: string
    onConfirm: () => void
    onCancel: () => void
    confirmText: string
    cancelText: string
}

const DialogGeneric: React.FC<IDialogGenericoProps> = ({
    open,
    onClose,
    titulo,
    conteudo,
    icone,
    onConfirm,
    onCancel,
    confirmText,
    cancelText
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className='dialog__box-modal'>
            <Box className='dialog__box-icone-texto'>
                <div className='dialog__icone-close'>
                    <span className={icone} />
                    <div className='dialog__texto'>
                        <DialogTitle className='dialog__titulo'>{titulo}</DialogTitle>
                        <DialogContentText className='dialog__subtitulo'>{conteudo}</DialogContentText>
                    </div>
                    <IconButton
                        aria-label=''
                        onClick={onClose}>
                        <span className='icon-x' />
                    </IconButton>
                </div>

                <DialogActions className='dialog__botao'>
                    <Button
                        data-testid='cancel-clear-all-button'
                        size='medium'
                        disableElevation
                        className='dialog__botao--cancelar'
                        onClick={onCancel}
                        variant='outlined'
                        color='primary'>
                        <Typography variant='button'>{cancelText}</Typography>
                    </Button>
                    <Button
                        data-testid='confirm-clear-all-button'
                        size='medium'
                        disableElevation
                        className='dialog__botao--confirmar'
                        onClick={onConfirm}
                        variant='contained'
                        color='primary'>
                        <Typography variant='button'>{confirmText}</Typography>
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    )
}

export default DialogGeneric
