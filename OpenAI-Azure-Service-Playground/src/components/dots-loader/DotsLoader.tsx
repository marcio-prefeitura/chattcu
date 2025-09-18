import React from 'react'
import './DotsLoader.scss'
import { ReactComponent as Robo } from '../../assets/logo.svg'
import Avatar from '@mui/material/Avatar'
import { Box } from '@mui/material'
// import Stack from '@mui/material/Stack'

const DotsLoader = () => {
    return (
        <>
            <div className=''>
                <Box className='message__box-avatar-text-chattcu modificador'>
                    <Avatar className='message__avatar-chattcu'>
                        <Robo />
                    </Avatar>
                    <Box className='message__box-avatar-text-chattcu'>
                        <div className='bouncing-loader'>
                            <div />
                            <div />
                            <div />
                        </div>
                    </Box>
                </Box>
            </div>
            <div data-testid='bouncing-loader'>
                <div />
                <div />
                <div />
            </div>
        </>
    )
}

export default DotsLoader
