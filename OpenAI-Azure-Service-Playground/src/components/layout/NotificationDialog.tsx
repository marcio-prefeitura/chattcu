import React from 'react'

import { Backdrop, Box, Button, Fade, Modal } from '@mui/material'

interface INotificationDialogProps {
    open: boolean
    onClose: () => void
}

const NotificationDialog: React.FC<INotificationDialogProps> = ({ open, onClose }) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500
            }}>
            <Fade in={open}>
                <Box className='notification-dialog'>
                    <h1 className='notification-dialog__titulo'>
                        Quer saber o que mudou? Acompanhe as novidades diretamente aqui!
                    </h1>

                    <Box>
                        <Box className='notification-dialog__container'>
                            <h3 className='notification-dialog__versão'> Versão 5.0 - 31/10/2024</h3>
                            <Box className='notification-dialog__subtitulo'>Especialistas:</Box>
                            <Box className='notification-dialog__lista'>
                                <ul>
                                    <li>
                                        Conheça nossos Especialistas! Agora você tem respostas precisas e instantâneas
                                        para suas dúvidas sobre Conhecimento Geral, Jurisprudência Selecionada, Sistema
                                        Casa, Processos e-TCU e Normativos do TCU. Além disso, o seletor automático
                                        identifica o especialista mais qualificado para responder sua pergunta,
                                        considerando a complexidade e o contexto da consulta. Você também pode mencionar
                                        nossos especialistas diretamente nas suas perguntas usando
                                        <code className='notification-dialog__especialista'>
                                            @nome_do_especialista.
                                        </code>
                                    </li>
                                </ul>
                            </Box>

                            <Box className='notification-dialog__subtitulo'>Escolha a IA ideal para você:</Box>
                            <Box className='notification-dialog__lista'>
                                <ul>
                                    <li>GPT-4-Turbo: modelo anterior, para garantir compatibilidade;</li>
                                    <li>GPT-4o: novo padrão polivalente;</li>
                                    <li>
                                        o1-preview: máximo de reflexão avançada para problemas complexos, extremamente
                                        lento;
                                    </li>
                                    <li>
                                        o1-mini: reflexão intermediária, relativamente lento. Excelente para
                                        programação;
                                    </li>
                                    <li>
                                        Claude 3.5 Sonnet (beta): Criativo e expressivo, ideal para gerar textos
                                        criativos.
                                    </li>
                                </ul>
                            </Box>
                            <Box className='notification-dialog__subtitulo'>Compartilhamento de conversas:</Box>
                            <Box className='notification-dialog__lista'>
                                <ul>
                                    <li>
                                        Compartilhamento de conversas: você pode gerar um link personalizado para
                                        qualquer conversa e cancela-lo quando quiser.
                                    </li>
                                    <li>
                                        Arquivamento de chats: organize suas conversas com mais facilidade! Agora você
                                        pode arquivar os chats que deseja guardar, mas que não precisa acessar com
                                        frequência. Mantenha seu histórico de conversas organizado.
                                    </li>
                                </ul>
                            </Box>
                        </Box>
                    </Box>
                    <Box className='notification-dialog__button'>
                        <Button
                            variant='contained'
                            size='medium'
                            disableElevation
                            color='primary'
                            onClick={onClose}>
                            Fechar
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    )
}

export default NotificationDialog
