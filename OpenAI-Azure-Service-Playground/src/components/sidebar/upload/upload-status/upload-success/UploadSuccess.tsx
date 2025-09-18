import React, { useEffect } from 'react'

import { Box, IconButton, Typography } from '@mui/material'

import './UploadSuccess.scss'

interface IUploadSuccessProps {
    name: string
    removeSuccessMessage: (fileName: string) => void
}

const UploadSuccess: React.FC<IUploadSuccessProps> = ({ name, removeSuccessMessage }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeSuccessMessage(name)
        }, 6000)

        return () => clearTimeout(timer)
    }, [name, removeSuccessMessage])
    return (
        <Box
            data-testid='upload-success'
            className={'upload-success'}>
            <Box className='upload-success__content'>
                <Box className='upload-success__labels'>
                    <Typography className='upload-success__name'>{name}</Typography>
                </Box>
                <IconButton
                    aria-label='fechar'
                    size='small'
                    className='icon-x-circle'
                    data-testid='cancel-button'
                    onClick={() => removeSuccessMessage(name)}
                />
            </Box>

            <Box />
        </Box>
    )
}

export default UploadSuccess
