import React from 'react'

import { Box } from '@mui/material'

import '../panel/Panel.scss'

interface EmptyChatProps {
    message: string
    onClick?: (manualPrompt?: string) => void
    icone: any
}

const CardMessage: React.FC<EmptyChatProps> = ({ message, onClick, icone }) => {
    return (
        <Box>
            <Box className='panel__item-box'>
                {onClick && (
                    <Box className='panel__container-icon'>
                        {icone ? (
                            <Box
                                className='panel__icon-box'
                                data-testid='icon'>
                                {icone}
                            </Box>
                        ) : (
                            <></>
                        )}
                        <Box className='panel__item-text'>
                            <ul>
                                <li>{message}</li>
                            </ul>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    )
}

export default CardMessage
