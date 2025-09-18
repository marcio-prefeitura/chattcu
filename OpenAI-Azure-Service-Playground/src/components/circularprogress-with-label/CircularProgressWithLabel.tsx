import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import CircularProgress, { circularProgressClasses } from '@mui/material/CircularProgress'
import 'react-circular-progressbar/dist/styles.css'

interface ICircularProgressWithLabelProps {
    value?: number
    'data-testid'?: string
}
export const CircularProgressWithLabel: React.FC<ICircularProgressWithLabelProps> = ({ 'data-testid': testId }) => {
    const [uploadProgress, setUploadProgress] = useState(0)
    const [indexingProgress, setIndexingProgress] = useState(0)
    const [totalProgress, setTotalProgress] = useState(0)

    const simulateUpload = () => {
        const uploadInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 100))
        }, 500)

        // Simula a conclusão do upload após 5 segundos
        setTimeout(() => {
            clearInterval(uploadInterval)
        }, 5000)
    }
    const simulateIndexing = () => {
        const indexingInterval = setInterval(() => {
            setIndexingProgress(prev => Math.min(prev + 5, 100))
        }, 1000)

        // Simula a conclusão da indexação após 10 segundos
        setTimeout(() => {
            clearInterval(indexingInterval)
        }, 10000)
    }

    useEffect(() => {
        // Atualiza o progresso total sempre que o uploadProgress ou indexingProgress mudar
        setTotalProgress((uploadProgress + indexingProgress) / 2)
    }, [uploadProgress, indexingProgress])

    // Inicia o upload e a indexação quando o componente for montado
    useEffect(() => {
        simulateUpload()
        simulateIndexing()
    }, [])

    return (
        <Box
            data-testid={testId}
            className='circular-progress-with-label-container'>
            <Box className='circular-progress-with-label-container-progress'>
                <CircularProgress
                    variant='determinate'
                    sx={{
                        color: theme => (theme.palette.mode === 'light' ? '#1a90ff' : '#308fe8'),
                        animationDuration: '550ms',
                        // position: 'absolute',
                        // left: 0,
                        [`& .${circularProgressClasses.circle}`]: {
                            strokeLinecap: 'round'
                        }
                    }}
                    size={18}
                    thickness={4}
                    value={totalProgress}
                />
            </Box>
        </Box>
    )
}
