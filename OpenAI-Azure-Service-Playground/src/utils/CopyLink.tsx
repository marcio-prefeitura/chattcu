import React, { useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { AlertColor } from '@mui/material/Alert'

interface CopyLinkProps {
    url: string
    handleAlert: (severity: AlertColor | undefined, message: string, duration?: number) => void
}

const CopyLink: React.FC<CopyLinkProps> = ({ url, handleAlert }) => {
    const [copied, setCopied] = useState<boolean>(false)

    const handleCopy = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        console.log('handleCopy no CopyLink dentro de Utils')
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true)
                handleAlert('info', 'Link copiado para a área de transferência')
                setTimeout(() => setCopied(false), 2000)
            })
            .catch(err => {
                console.error('Erro ao copiar: ', err)
                handleAlert('error', 'Erro ao copiar o link')
            })
    }

    return (
        <Tooltip title={copied ? 'Link copiado!' : 'Copiar link'}>
            <IconButton
                data-testid='button-copy-link' // Add the test ID here
                size='small'
                onClick={handleCopy}>
                {copied ? <span className='icon-check' /> : <span className='icon-content_copy' />}
            </IconButton>
        </Tooltip>
    )
}

export default CopyLink
