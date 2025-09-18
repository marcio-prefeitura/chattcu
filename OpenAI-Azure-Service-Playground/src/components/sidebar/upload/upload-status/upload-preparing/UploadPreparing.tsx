import { Box, Typography } from '@mui/material'
import './UploadPreparing.scss'
import React from 'react'

interface IUploadPreparingProps {
    name: string
    size: string
}
export const UploadPreparing: React.FC<IUploadPreparingProps> = ({ name, size }) => {
    return (
        <Box
            data-testid='upload-preparing'
            className={'upload-preparing'}>
            <Typography className='upload-preparing__name'>{name}</Typography>
            <Box className='upload-preparing__container'>
                <Box className='upload-preparing__arquivo-tamanho'>{size}MB</Box>
                <div className='upload-preparing__arquivo-uso'> Preparando arquivo para uso...</div>
            </Box>
        </Box>
    )
}

export default UploadPreparing
