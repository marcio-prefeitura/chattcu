import React from 'react'

import { Alert, IconButton, Snackbar, Box, CircularProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import './MessageToast.scss'

interface IMessageToastDownloadProps {
    show: boolean
    message: string
    onClose?: () => void
    datatestid?: string
}

const MessageToastDownload: React.FC<IMessageToastDownloadProps> = ({ show = false, message, onClose, datatestid }) => {
    const handleClose = () => {
        if (onClose) onClose()
    }

    const action = (
        <IconButton
            data-testid='btn-close-download-message'
            color='inherit'
            size='small'
            aria-label='close'
            onClick={handleClose}>
            <CloseIcon fontSize='small' />
        </IconButton>
    )

    return (
        <Snackbar
            open={show}
            onClose={handleClose}
            data-testid={datatestid}>
            <Alert
                className='mensagem__info-container'
                severity='info'
                variant='filled'
                action={action}
                sx={{ width: '100%' }}>
                <Box
                    display='flex'
                    alignItems='center'>
                    <CircularProgress size={10} />
                    {message}
                </Box>
            </Alert>
        </Snackbar>
    )
}

export default MessageToastDownload
