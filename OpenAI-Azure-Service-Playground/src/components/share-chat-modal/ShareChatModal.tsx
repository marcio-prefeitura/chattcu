import { useState, useEffect } from 'react'

import { Modal, Backdrop, Fade, Button, Typography, Box, IconButton, AlertColor } from '@mui/material'
import { useMutation } from '@tanstack/react-query'

import { IChat } from '../../infrastructure/utils/types'
import { IUserInfo } from '../../hooks/useUserInfo'
import { shareChat, updateShared, SharedSent } from '../../infrastructure/api'

import './ShareChatModal.scss'

interface ShareChatModalProps {
    profile: IUserInfo
    chat: IChat | null
    open: boolean
    onClose: () => void
    handleAlert: (severity: AlertColor | undefined, MessageToast: string, duration?: number) => any
}

const ShareChatModal: React.FC<ShareChatModalProps> = ({ chat, open, onClose, handleAlert }) => {
    const [linkCompleto, setLinkCompleto] = useState<string | null>(null)
    const [botaoTitulo, setBotaoTitulo] = useState('Gerar Link')
    const [mensagemTemporaria, setMensagemTemporaria] = useState<string | null>(null)
    const [linkGerado, setLinkGerado] = useState(false)
    const [shareId, setShareId] = useState<string | null>(null)

    useEffect(() => {
        if (open && chat?.id) {
            // Reseto os estados e verifico se tem  compartilhamento existente
            setLinkCompleto(null)
            setLinkGerado(false)
            setBotaoTitulo('Gerar Link')
            setShareId(null)
            setMensagemTemporaria(null)

            SharedSent()
                .then(response => {
                    const share = response?.find(item => item.chat?.id === chat.id)
                    if (share?.id) {
                        setShareId(share.id)
                        setBotaoTitulo('Atualizar Link')
                        setLinkCompleto(`${process.env.REACT_APP_BACK_ENDPOINT}/share?share_id=${share.id}`)
                        setLinkGerado(true)
                    }
                })
                .catch(console.error)
        }
    }, [open, chat?.id])

    const shareMutation = useMutation(
        async () => {
            if (!chat?.id) return null

            const currentShares = await SharedSent()
            const currentShare = currentShares?.find(item => item.chat?.id === chat.id)

            if (currentShare?.id) {
                return await updateShared(currentShare.id)
            }
            return await shareChat(chat.id)
        },
        {
            onSuccess: async response => {
                if (!response) return

                const chatLink = `${process.env.REACT_APP_BACK_ENDPOINT}/share?share_id=${response}`

                if (shareId) {
                    try {
                        await navigator.clipboard.writeText(chatLink)
                        handleAlert('success', 'Link atualizado e copiado')
                        onClose()
                    } catch (error) {
                        console.error('Erro ao copiar o link:', error)
                        handleAlert('error', 'Erro ao copiar o link')
                    }
                    return
                }

                setBotaoTitulo('Gerando...')
                setTimeout(() => {
                    setLinkCompleto(chatLink)
                    setLinkGerado(true)
                    setBotaoTitulo('Copiando...')

                    setTimeout(() => {
                        setBotaoTitulo('Copiar')
                        handleAlert('success', 'Link gerado e copiado')
                    }, 1000)
                }, 1000)
            },
            onError: (error: Error) => {
                handleAlert('error', `Erro ao ${shareId ? 'atualizar' : 'compartilhar'}: ${error.message}`)
                console.error('Erro ao compartilhar o chat:', error)
            }
        }
    )

    if (!chat) return null

    const handleShareAndCopy = async () => {
        if (!linkGerado || shareId) {
            shareMutation.mutate()
        } else {
            try {
                if (linkCompleto) {
                    await navigator.clipboard.writeText(linkCompleto)
                    setMensagemTemporaria('Link copiado para a área de transferência')
                    setTimeout(() => {
                        setMensagemTemporaria(null)
                        if (!shareId) {
                            setLinkCompleto(null)
                            setLinkGerado(false)
                            setBotaoTitulo('Gerar Link')
                        }
                    }, 3000)
                    onClose()
                    setTimeout(() => {
                        handleAlert('success', 'Link copiado para a área de transferência')
                    }, 500)
                }
            } catch (error) {
                handleAlert('error', 'Erro ao copiar o link')
                console.error('Erro ao copiar o link:', error)
            }
        }
    }

    return (
        <Modal
            open={open}
            onClose={() => {
                setLinkCompleto(null)
                setLinkGerado(false)
                setBotaoTitulo('Gerar Link')
                setShareId(null)
                setMensagemTemporaria(null)
                onClose()
            }}
            data-testid='share-chat-modal'
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500
            }}>
            <Fade in={open}>
                <Box className='share-chat-modal'>
                    <Box className='share-chat-modal__box-icone-texto'>
                        <div className='share-chat-modal__icone-close'>
                            <span className='icon-share' />
                            <div className='share-chat-modal__texto'>
                                <Typography className='share-chat-modal__titulo'>
                                    {`Compartilhar chat "${chat.titulo}"`}
                                </Typography>
                            </div>

                            <IconButton
                                aria-label=''
                                onClick={onClose}>
                                <span className='icon-x' />
                            </IconButton>
                        </div>
                    </Box>

                    <Box>
                        <Box className='share-chat-modal__message-box-container'>
                            <div className='share-chat-modal__texto'>
                                <div className='share-chat-modal__texto__nenhum-arquivo'>
                                    {linkCompleto ? (
                                        <p>{linkCompleto}</p>
                                    ) : (
                                        <p>O link será {shareId ? 'atualizado' : 'gerado'} ao clicar no botão</p>
                                    )}
                                    <Box className='share-chat-modal__botao'>
                                        <Button
                                            variant='contained'
                                            disableElevation
                                            color='primary'
                                            className='share-chat-modal__botao--confirmar'
                                            onClick={handleShareAndCopy}
                                            disabled={
                                                shareMutation.isLoading ||
                                                botaoTitulo === 'Gerando...' ||
                                                botaoTitulo === 'Copiando...'
                                            }>
                                            <Typography style={{ textTransform: 'none' }}>{botaoTitulo}</Typography>
                                        </Button>
                                    </Box>
                                    {mensagemTemporaria && (
                                        <Typography
                                            variant='body2'
                                            className='mensagem-temporaria'>
                                            {mensagemTemporaria}
                                        </Typography>
                                    )}
                                </div>
                            </div>
                        </Box>
                    </Box>
                    <Typography className='share-chat-modal__subtitulo'>
                        Qualquer pessoa com o link pode acessar ou encaminhar o chat. Compartilhe com responsabilidade
                    </Typography>
                </Box>
            </Fade>
        </Modal>
    )
}

export default ShareChatModal
