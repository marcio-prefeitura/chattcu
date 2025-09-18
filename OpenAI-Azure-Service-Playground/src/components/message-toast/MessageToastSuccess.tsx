import React, { useEffect } from 'react'
import { v4 as uuid } from 'uuid'

import { Alert, AlertColor, Snackbar } from '@mui/material'

import './MessageToast.scss'

interface IMessageToastSuccessProps {
    show: boolean
    initialMsg: any[]
    severity?: AlertColor
    variant?: 'outlined' | 'filled' | 'standard'
    title?: string
    duration?: number | null
    onClose?: (status: boolean) => void
    datatestid?: string
}

const MessageToastSuccess: React.FC<IMessageToastSuccessProps> = ({
    show = false,
    initialMsg,
    duration = 5000,
    onClose,
    datatestid
}) => {
    const handleClose = (/*e: React.MouseEvent, reason: string*/) => {
        if (onClose) onClose(false)
    }
    const messageSuccess = initialMsg.map(item => item.message).join('\n')
    const snackbarProps = {
        open: show,
        onClose: handleClose,
        'data-testid': datatestid,
        ...(duration && { autoHideDuration: duration })
    }

    useEffect(() => {
        if (show && onClose && duration && duration > 0) {
            const timer = setTimeout(() => {
                onClose(false)
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [show, duration, onClose])

    return (
        <Snackbar {...snackbarProps}>
            <Alert
                className='mensagem__sucesso'
                onClose={handleClose}
                severity='success'
                variant='filled'
                sx={{ width: '100%' }}>
                {messageSuccess.split('\n').map(line => (
                    <React.Fragment key={`success-${uuid()}`}>
                        {line}
                        <br />
                    </React.Fragment>
                ))}
            </Alert>
        </Snackbar>
    )
}

export default MessageToastSuccess
