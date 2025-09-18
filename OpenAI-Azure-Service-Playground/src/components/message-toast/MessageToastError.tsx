import React from 'react'
import { v4 as uuid } from 'uuid'

import { Alert, AlertColor, IconButton, Snackbar } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import './MessageToast.scss'

interface IMessageToastErrorProps {
    show: boolean
    initialMsg: any[]
    severity?: AlertColor
    variant?: 'outlined' | 'filled' | 'standard'
    title?: string
    duration?: number | null
    onClose?: (status: boolean) => void
    datatestid?: string
}

const MessageToastError: React.FC<IMessageToastErrorProps> = ({
    show = false,
    initialMsg,
    severity,
    duration = null,
    onClose,
    datatestid
}) => {
    const handleClose = (/*e: React.MouseEvent, reason: string*/) => {
        if (onClose) onClose(false)
    }
    const action = (
        <IconButton
            data-testid='btn-close-message'
            color='inherit'
            size='small'
            aria-label='close'
            onClick={handleClose}>
            <CloseIcon fontSize='small' />
        </IconButton>
    )
    const messageErrors = initialMsg.map(item => item.erro).join('\n')
    const snackbarProps = {
        open: show,
        onClose: handleClose,
        'data-testid': datatestid,
        ...(duration && { autoHideDuration: duration * 1000 }),
        ...(!severity && { message: messageErrors, action: action })
    }

    return (
        <Snackbar {...snackbarProps}>
            <Alert
                className='mensagem__erro'
                onClose={handleClose}
                severity='error'
                variant='filled'
                sx={{ width: '100%' }}>
                {messageErrors.split('\n').map(line => (
                    <React.Fragment key={`error-${uuid()}`}>
                        {line}
                        <br />
                    </React.Fragment>
                ))}
            </Alert>
        </Snackbar>
    )
}

export default MessageToastError
