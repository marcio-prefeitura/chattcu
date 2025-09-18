import './LinearProgressWithLabel.css'
import React from 'react'
import { Box, Typography, LinearProgress } from '@mui/material'

interface ILinearProgressWithLabelProps {
    value: number
    'data-testid'?: string
}
export const LinearProgressWithLabel: React.FC<ILinearProgressWithLabelProps> = ({ value, 'data-testid': testId }) => {
    return (
        <Box
            data-testid={testId}
            className='linear-progress-with-label-container'>
            <Box className='linear-progress-with-label-container-progress'>
                <LinearProgress
                    variant='determinate'
                    value={value}
                />
            </Box>
            <Box className='linear-progress-with-label-container-label'>
                <Typography>{`${Math.round(value)}%`}</Typography>
            </Box>
        </Box>
    )
}
