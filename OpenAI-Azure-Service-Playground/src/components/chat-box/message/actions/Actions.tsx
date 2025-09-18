import React, { useState } from 'react'
import removeMd from 'remove-markdown'
import { Box, IconButton, Tooltip } from '@mui/material'
import MessageToast from '../../../message-toast/MessageToast'
import If from '../../../operator/if'
import './Actions.scss'

interface ActionsProps {
    cod_message: string
    message: string
    reacao: string | undefined
    onOpenFeedbackDialog: (cod_message: string, reacao: 'LIKED' | 'DISLIKED') => void
}

const Actions: React.FC<ActionsProps> = ({ cod_message, message, reacao, onOpenFeedbackDialog }) => {
    const [copyState, setCopyState] = useState({
        isCopied: false,
        showSuccess: false
    })

    const handleCopy = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, withMD?: boolean) => {
        const textToCopy = event.currentTarget.getAttribute('data-message') ?? ''
        const finalText = withMD ? textToCopy : removeMd(textToCopy)

        try {
            await navigator.clipboard.writeText(finalText)
            setCopyState({ isCopied: true, showSuccess: true })

            setTimeout(() => {
                setCopyState({ isCopied: false, showSuccess: false })
            }, 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    return (
        <div className='message-copy'>
            <If test={copyState.isCopied}>
                <IconButton key={`ib-message-copy-cliked-${cod_message}`}>
                    <Box className='message-copy__copy icon-check' />
                </IconButton>
            </If>

            <If test={!copyState.isCopied}>
                <Tooltip title='Copiar'>
                    <IconButton
                        key={`ib-message-copy-${cod_message}`}
                        onClick={handleCopy}
                        data-message={message}>
                        <span className='icon-content_copy message-copy__copy' />
                    </IconButton>
                </Tooltip>
            </If>

            <Tooltip title='Gostei'>
                <IconButton
                    key={`ib-message-fliked-like-${cod_message}`}
                    className={reacao === 'LIKED' ? 'liked__button-selecionado' : ''}
                    onClick={() => onOpenFeedbackDialog(cod_message, 'LIKED')}>
                    <Box className='icon-thumbs-up' />
                </IconButton>
            </Tooltip>

            <Tooltip title='Não Gostei'>
                <IconButton
                    key={`ib-message-fliked-nlike-${cod_message}`}
                    className={reacao === 'DISLIKED' ? 'disliked__button-selecionado' : ''}
                    onClick={() => onOpenFeedbackDialog(cod_message, 'DISLIKED')}>
                    <Box className='icon-thumbs-down' />
                </IconButton>
            </Tooltip>

            <If test={copyState.showSuccess}>
                <MessageToast
                    key={`msg-act-msg-${cod_message}`}
                    severity='info'
                    show={copyState.showSuccess}
                    msg={'Copiado para a área de transferência!'}
                    duration={5}
                    onClose={() => setCopyState(prev => ({ ...prev, showSuccess: false }))}
                    data-testid='message-toast'
                />
            </If>
        </div>
    )
}

export default Actions
