import React from 'react'

import { Box, IconButton, Typography } from '@mui/material'

import './UploadError.scss'

interface IUploadErrorProps {
    name: string
    msgError: string
    removeErrorMessage: (fileName: string) => void
}
export const UploadError: React.FC<IUploadErrorProps> = ({ name, msgError, removeErrorMessage }) => {
    return (
        <>
            <Box
                data-testid='upload-error'
                className={'upload-error'}>
                <Box className='upload-error__content'>
                    <Box className='upload-error__labels'>
                        <Typography className='upload-error__name'>{name}</Typography>
                    </Box>
                    <IconButton
                        aria-label='fechar'
                        size='small'
                        className='icon-x-circle'
                        data-testid='cancel-button'
                        onClick={() => removeErrorMessage(name)}
                    />
                </Box>
                <Box />
            </Box>
            <Box className='upload-error__msg-error'>{msgError}</Box>
        </>
    )
}

export default UploadError
