import './UploadProgress.scss'
import React from 'react'
import { Typography, Box /* IconButton */ } from '@mui/material'
// import { Close } from '@mui/icons-material'
import { LinearProgressWithLabel } from './linearprogress-with-label/LinearProgressWithLabel'

interface IUploadProgressProps {
    name: string
    size: string
    readableSize: string
    error?: boolean
    errorMsg?: string
    progress: number
    onCancel: () => void
}
export const UploadProgress: React.FC<IUploadProgressProps> = ({
    name,
    /*size,*/
    // readableSize,
    progress,
    // onCancel,
    error = false,
    errorMsg = ''
}) => {
    return (
        <Box
            data-testid='upload-progress'
            className={`upload-progress ${error ? 'error' : ''}`}>
            <Box className='upload-progress__content'>
                <Box className='upload-progress__labels'>
                    <Box>
                        <Typography className='upload-progress__name'>{name}</Typography>
                        {error && errorMsg && <Typography className='error'>{errorMsg}</Typography>}
                    </Box>
                    {/* <Box>
                        <IconButton
                            data-testid='cancel-button'
                            onClick={onCancel}>
                            <Close />
                        </IconButton>
                    </Box> */}
                </Box>
                <LinearProgressWithLabel
                    data-testid={'progressbar'}
                    value={progress}
                />
            </Box>
        </Box>
    )
}
