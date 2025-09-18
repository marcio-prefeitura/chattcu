import { Button, Box, Typography, TextField, IconButton, DialogContent, DialogContentText } from '@mui/material'
import { AxiosError } from 'axios'
import React, { useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { IFeedback } from '../../infrastructure/utils/types'
import { enviarFeedback } from '../../infrastructure/api'
import If from '../operator/if'

import './FeedbackDialog.scss'

interface FeedbackDialogProps {
    children?: React.ReactNode
    chat_id: string
    cod_mensagem: string
    reacao: 'LIKED' | 'DISLIKED' | undefined
    setReacao: any
    onCancel: () => void
    onSend?: (feedback: IFeedback) => void
    setIsShowSucessSnack: any
    setIsShowErrorSnack: any
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
    chat_id,
    cod_mensagem,
    reacao,
    setReacao,
    onCancel,
    onSend,
    setIsShowSucessSnack,
    setIsShowErrorSnack
}) => {
    const [comentario, setComentario] = useState<string>('')
    const [selectedReason, setSelectedReason] = useState<string | null>(null)
    const [desabilitaInput, setDesabilitaInput] = useState<boolean>(false)
    const [desabilitaButtons, setDesabilitaButtons] = useState<boolean>(false)

    const mutation = useMutation((newFeedback: IFeedback) => enviarFeedback(newFeedback), {
        onSuccess: () => {
            setIsShowSucessSnack(true)
            handleCancel()
        },
        onError: () => setIsShowErrorSnack(true),
        useErrorBoundary: (error: AxiosError) => {
            const responseStatus = error.response?.status
            return responseStatus === 401 || responseStatus === 403
        }
    })

    const handleCancel = () => {
        onCancel()
        setComentario('')
        setReacao('')
        setSelectedReason(null)
        setDesabilitaButtons(false)
    }

    const handleSendFeedback = async () => {
        const novoFeedback = {
            chat_id: chat_id,
            cod_mensagem: cod_mensagem,
            conteudo: comentario,
            reacao: reacao,
            inveridico: selectedReason === 'inveridico',
            nao_ajudou: selectedReason === 'inutil',
            ofensivo: selectedReason === 'ofensivo'
        }

        await mutation.mutateAsync(novoFeedback)
        if (onSend) onSend(novoFeedback)
    }

    const handleReasonSelect = (reason: string) => {
        if (selectedReason === reason) {
            setSelectedReason(null)
            setDesabilitaInput(false)
        } else {
            setSelectedReason(reason)
            setDesabilitaInput(true)
        }
        setDesabilitaButtons(comentario.length > 0)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value
        setComentario(text)

        setDesabilitaButtons(text.length > 0)
        if (text.length === 0) {
            setDesabilitaButtons(selectedReason !== null)
        }
    }

    return (
        <>
            <If test={open}>
                <Box className='feedback'>
                    <Box className='feedback__main'>
                        <Box className='feedback__box-icone-texto'>
                            <div className='feedback__icone-close'>
                                <Box>
                                    <Typography className='feedback__box-informacoes'>
                                        Forneça comentários adicionais
                                    </Typography>
                                </Box>

                                <IconButton
                                    aria-label=''
                                    onClick={handleCancel}>
                                    <span className='icon-x' />
                                </IconButton>
                            </div>
                        </Box>
                        <If test={reacao === 'DISLIKED'}>
                            <Box className='feedback__button-group'>
                                <Button
                                    className='no-capitalization'
                                    variant={selectedReason === 'ofensivo' ? 'contained' : 'outlined'}
                                    disabled={desabilitaButtons}
                                    onClick={() => handleReasonSelect('ofensivo')}>
                                    Ofensivo/Perigoso
                                </Button>
                                <Button
                                    className='no-capitalization'
                                    variant={selectedReason === 'inveridico' ? 'contained' : 'outlined'}
                                    disabled={desabilitaButtons}
                                    onClick={() => handleReasonSelect('inveridico')}>
                                    Os fatos não estão corretos
                                </Button>
                                <Button
                                    className='no-capitalization'
                                    variant={selectedReason === 'inutil' ? 'contained' : 'outlined'}
                                    disabled={desabilitaButtons}
                                    onClick={() => handleReasonSelect('inutil')}>
                                    Outro
                                </Button>
                            </Box>
                        </If>
                        <Box>
                            <TextField
                                fullWidth
                                placeholder={
                                    reacao === 'LIKED'
                                        ? 'Deixe seu comentário'
                                        : 'Qual foi o problema com a resposta? Como poderia ser melhorado?'
                                }
                                multiline
                                disabled={desabilitaInput}
                                className='feedback__textfield'
                                rows={2}
                                size='small'
                                value={comentario}
                                onChange={handleTextChange}
                            />
                            <DialogContent className='feedback__box'>
                                <DialogContentText className='feedback__box--text'>
                                    Para ajudar a melhorar o ChatTCU, sua colaboração é essencial.
                                </DialogContentText>
                            </DialogContent>
                        </Box>

                        <Box className='feedback__botao-action'>
                            <Button
                                size='medium'
                                disableElevation
                                className='feedback__botao-action--cancelar'
                                variant='outlined'
                                onClick={handleCancel}
                                data-testid='cancelar-feedback'>
                                Cancelar
                            </Button>
                            <Button
                                size='medium'
                                disableElevation
                                disabled={comentario.length === 0 && selectedReason === null} // Desabilita o botão de confirmar se não há comentário e nenhuma razão selecionada
                                className='feedback__botao-action--confirmar'
                                data-testid='modal-save-action'
                                variant='contained'
                                onClick={handleSendFeedback}>
                                Confirmar
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </If>
        </>
    )
}

export default FeedbackDialog
