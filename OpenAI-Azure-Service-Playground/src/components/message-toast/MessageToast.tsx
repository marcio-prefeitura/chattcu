import React, { useEffect, useState } from 'react'

import { Alert, AlertColor, AlertTitle, IconButton, Snackbar } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import If from '../operator/if'

import './MessageToast.scss'

export interface IMessageToastProps {
    show: boolean
    msg: string | React.ReactNode
    severity?: AlertColor
    variant?: 'outlined' | 'filled' | 'standard'
    title?: string
    duration?: number
    onClose?: () => void
    datatestid?: string
}

const MessageToast: React.FC<IMessageToastProps> = ({
    show = true,
    msg = 'Erro',
    severity,
    variant = 'filled',
    title,
    duration = null,
    onClose,
    datatestid
}) => {
    const [open, setOpen] = useState(show)

    const handleClose = () => {
        if (onClose) onClose()

        setOpen(false)
    }

    useEffect(() => {
        setOpen(show)
    }, [show])

    const action = (
        <React.Fragment>
            <IconButton
                data-testid='btn-close-message'
                size='small'
                color='inherit'
                aria-label='close'
                onClick={handleClose}>
                <CloseIcon fontSize='small' />
            </IconButton>
        </React.Fragment>
    )

    const snackbarProps = {
        open: open,
        onClose: handleClose,
        'data-testid': datatestid,
        ...(duration && { autoHideDuration: duration * 1000 }),
        ...(!severity && { message: msg, action: action })
    }

    return (
        <>
            <If test={severity}>
                <Snackbar
                    {...snackbarProps}
                    className='mensagem'>
                    <Alert
                        className={`mensagem__container${severity === 'error' ? 'mensagem__erro' : ''}${
                            severity === 'success' ? ' mensagem__sucesso' : ''
                        }${severity === 'info' ? ' mensagem__info' : ''}${
                            severity === 'warning' ? ' mensagem__warning' : ''
                        }`}
                        variant={variant}
                        severity={severity}>
                        <If test={title}>
                            <AlertTitle>{title}</AlertTitle>
                        </If>
                        {msg}
                        {action}
                    </Alert>
                </Snackbar>
            </If>
            <If test={!severity}>
                <Snackbar {...snackbarProps} />
            </If>
        </>
    )
}

export default MessageToast
