import './TooltipModalFile.scss'
import { Backdrop, Box, Button, DialogTitle, Divider, Fade, IconButton, Modal, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import React, { useState } from 'react'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import { CircularProgressWithLabel } from '../circularprogress-with-label/CircularProgressWithLabel'
import If from '../operator/if'
import { useFileDownload } from '../../hooks/useFileDownload'
interface TooltipModalProps {
    openModalTrecho: boolean
    trecho: any | null
    handleOpenModal: (openModal: boolean) => void
}

const TooltipModalFile: React.FC<TooltipModalProps> = ({ openModalTrecho, trecho, handleOpenModal }) => {
    const [showProgress, setShowProgress] = useState<boolean>(false)
    const { downloadSingleFile } = useFileDownload()
    // const pagina = trecho && trecho.pagina_arquivo ? `página ${trecho.pagina_arquivo}` : 'RESUMO'
    const conteudoFormatado =
        trecho && trecho.pagina_arquivo !== null ? trecho?.conteudo : trecho?.conteudo.replaceAll('RESUMO', '')

    const handleClose = () => {
        handleOpenModal(false)
    }

    const handleDownloadFile = async () => {
        setShowProgress(true)
        try {
            await downloadSingleFile({
                id: trecho.id_arquivo_mongo,
                nome: trecho.id_arquivo_mongo
            })
        } catch (error) {
            // Adicione aqui o tratamento de erro apropriado
            console.error('Erro ao baixar o arquivo:', error)
        }
        setShowProgress(false)
    }

    if (!trecho) {
        return null
    }
    const tituloModal = trecho.id_registro?.split(' - número ')[0]

    return (
        <div>
            <Modal
                open={openModalTrecho}
                onClose={handleClose}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500
                }}>
                <Fade in={openModalTrecho}>
                    <div className='trecho-modal-file'>
                        <div className='trecho-modal-file__header'>
                            <DialogTitle className='trecho-modal-file__titulo'>{tituloModal}</DialogTitle>
                            <IconButton
                                aria-label='close'
                                onClick={handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                        <Divider />
                        <DialogContent className='trecho-modal-file__box'>
                            <DialogContentText id='alert-dialog-description'>
                                <Typography
                                    className='trecho-modal-file__texto'
                                    variant='body2'
                                    dangerouslySetInnerHTML={{ __html: conteudoFormatado }}
                                />
                            </DialogContentText>
                        </DialogContent>
                        <Divider />
                        <div className='trecho-modal-file__box-botao'>
                            <Button
                                variant='outlined'
                                disableElevation
                                size='medium'
                                disabled={showProgress}
                                onClick={handleDownloadFile}
                                className='trecho-modal-file__box-botao--download'>
                                <div className='icon-download' />
                                <Typography variant='button'>Download</Typography>
                                <If test={showProgress}>
                                    <Box className='trecho-modal-file__box-botao--progress'>
                                        <CircularProgressWithLabel data-testid={'progressbar'} />
                                    </Box>
                                </If>
                            </Button>
                            <Button
                                variant='outlined'
                                disableElevation
                                size='medium'
                                onClick={handleClose}
                                className='trecho-modal-file__box-botao--botao'>
                                <Typography variant='button'>Fechar</Typography>
                            </Button>
                        </div>
                    </div>
                </Fade>
            </Modal>
        </div>
    )
}

export default TooltipModalFile
