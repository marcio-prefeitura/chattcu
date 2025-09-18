import * as React from 'react'
import './icons.scss'
import { Box } from '@mui/material'

const FolderIcon: React.FC<any> = () => {
    return (
        <Box className='folder'>
            <span className='material-symbols-rounded'>folder_open</span>
        </Box>
    )
}

export default FolderIcon
