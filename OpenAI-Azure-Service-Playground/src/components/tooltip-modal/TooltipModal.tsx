import { Backdrop, Box, Button, DialogTitle, Divider, Fade, IconButton, Modal, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import { useAlert } from '../../context/AlertContext'

import MessageToast from '../message-toast/MessageToast'

import './TooltipModal.scss'
import CopyLink from '../../utils/CopyLink'

interface TooltipModalProps {
    openModalTrecho: boolean
    trecho: any | null
    handleOpenModal: (openModal: boolean) => void
}

const TooltipModal: React.FC<TooltipModalProps> = ({ openModalTrecho, trecho, handleOpenModal }) => {
    const { alert, handleAlert } = useAlert()

    const handleClose = () => {
        handleOpenModal(false)
    }

    if (!trecho) {
        return null
    }

    const tituloModal = trecho.id_registro?.split('_')[0]

    return (
        <Box>
            <Modal
                open={openModalTrecho}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500 }}>
                <Fade in={openModalTrecho}>
                    <Box className='trechomodal'>
                        <Box className='trechomodal__header'>
                            <DialogTitle className='trechomodal__titulo'>{tituloModal}</DialogTitle>
                            <IconButton
                                aria-label='close'
                                className='trechomodal__header__fechar'
                                onClick={handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Divider />
                        <DialogContent className='trechomodal__box'>
                            <DialogContentText id='alert-dialog-description'>
                                <Typography
                                    className='trechomodal__texto'
                                    variant='body2'
                                    dangerouslySetInnerHTML={{ __html: trecho.conteudo }}
                                />
                            </DialogContentText>
                        </DialogContent>
                        <Divider />
                        <Box className='trechomodal__linha'>
                            <Typography className='trechomodal__label'>Link:</Typography>
                            <Typography
                                className='trechomodal__link'
                                variant='body2'
                                onClick={() => window.open(trecho.link_sistema, '_blank')}
                                dangerouslySetInnerHTML={{ __html: trecho.link_sistema }}
                            />
                            <CopyLink
                                url={trecho.link_sistema}
                                handleAlert={handleAlert}
                            />
                        </Box>
                        <Box className='trechomodal__box-botao'>
                            <Button
                                variant='outlined'
                                disableElevation
                                size='medium'
                                onClick={handleClose}
                                className='trechomodal__botao'>
                                <Typography variant='button'>Fechar</Typography>
                            </Button>
                        </Box>
                    </Box>
                </Fade>
            </Modal>
            <Box className='new-sidebar__alert'>{alert && <MessageToast {...alert} />}</Box>
        </Box>
    )
}

export default TooltipModal
