import React, { useState } from 'react'
import { LanguageHandler } from '../message-utils'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atelierCaveLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { Tooltip } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard'
import If from '../../../operator/if'
import MessageToast from '../../../message-toast/MessageToast'

interface SyntaxCodeHighlighterProps {
    texto: string
    index: number
    conteudoEmPartes: string[]
}

const SyntaxCodeHighlighter: React.FC<SyntaxCodeHighlighterProps> = ({ texto, index, conteudoEmPartes }) => {
    const { language, textContent } = new LanguageHandler(texto).getAsObject()
    const { copyToClipboard, hasCopied } = useCopyToClipboard()
    const [showCopySuccess, setShowCopySuccess] = useState(false)

    const handleCopy = (index: number) => {
        const text = conteudoEmPartes[index] ?? ''
        const plainText = new LanguageHandler(text).getTextContent()
        copyToClipboard(plainText)
        setShowCopySuccess(true)
        setTimeout(() => {
            setShowCopySuccess(false)
        }, 2000)
    }

    const removeQuotation = (content: string) => {
        return content.startsWith('```') ? content.slice(3) : content
    }

    return (
        <div className='message__highlighter'>
            <div className='message__highlighter-header'>
                <div className='message__highlighter-language'>{language}</div>
                <Tooltip title='Copiar'>
                    {hasCopied ? (
                        <CheckIcon data-testid='message__highlighter-checkicon' />
                    ) : (
                        <ContentCopyIcon
                            data-testid='message__highlighter-copyicon'
                            className='message__highlighter-icon'
                            component={'svg'}
                            data-message={texto}
                            onClick={() => handleCopy(index)}
                        />
                    )}
                </Tooltip>
            </div>
            <SyntaxHighlighter
                className='message__highlighter-custom'
                key={`high-${index}`}
                language={language}
                style={atelierCaveLight}>
                {removeQuotation(textContent)}
            </SyntaxHighlighter>
            <If test={showCopySuccess}>
                <MessageToast
                    key={`msg-act-msg-${index}`}
                    severity='info'
                    show={showCopySuccess}
                    msg={'Copiado para a área de transferência!'}
                    duration={5}
                    onClose={() => setShowCopySuccess(false)}
                />
            </If>
        </div>
    )
}

export default SyntaxCodeHighlighter
