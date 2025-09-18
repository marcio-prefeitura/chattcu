import './Progress.css'
import { CircularProgress } from '@mui/material'
import { Box } from '@mui/system'

const Progress = () => {
    return (
        <Box
            className='backgroud-progress'
            data-testid='background-progress'>
            <Box
                className='modal-progress'
                data-testid='modal-progress'>
                <CircularProgress />
            </Box>
        </Box>
    )
}

export default Progress
