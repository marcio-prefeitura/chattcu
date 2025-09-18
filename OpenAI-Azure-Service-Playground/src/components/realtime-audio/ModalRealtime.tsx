import { Backdrop, Box, DialogTitle, Divider, Fade, IconButton, Modal, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import './ModalRealtime.scss'
import AudioControl, { IAudioControlHandle } from './AudioControl'
import { useRef } from 'react'

interface IModalRealtime {
    openModal: boolean
    handleOpenModal: (openModal: boolean) => void
    titulo: string
    descricao: string
}

const ModalRealtime: React.FC<IModalRealtime> = ({ openModal, handleOpenModal, titulo, descricao }) => {
    const audioControlRef = useRef<IAudioControlHandle>(null)
    const handleClose = () => {
        if (audioControlRef.current) audioControlRef.current.cleanup()
        handleOpenModal(false)
    }

    return (
        <Box>
            <Modal
                open={openModal}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500 }}>
                <Fade in={openModal}>
                    <Box className='modaldefault'>
                        <Box className='modaldefault__header'>
                            <DialogTitle className='modaldefault__titulo'>{titulo}</DialogTitle>
                            <IconButton
                                aria-label='close'
                                className='modaldefault__header__fechar'
                                onClick={handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <DialogContent className='modaldefault__box'>
                            <DialogContentText>
                                <AudioControl ref={audioControlRef} />
                            </DialogContentText>
                            <Typography
                                className='modaldefault__texto'
                                variant='body2'
                                dangerouslySetInnerHTML={{ __html: descricao }}
                            />
                        </DialogContent>
                        <Divider />
                        <Box className='modaldefault__linha'>
                            <Typography className='modaldefault__label'>
                                {'Há possibilidade de pesquisar no índice normas, ex.:' +
                                    "'Qual a norma que trata a permanência de pessoas no âmbito do TCU?'"}
                            </Typography>
                        </Box>
                    </Box>
                </Fade>
            </Modal>
        </Box>
    )
}
export default ModalRealtime
