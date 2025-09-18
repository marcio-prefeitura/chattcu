import React from 'react'

import { Box } from '@mui/material'

import If from '../operator/if'

import './CounterAccordion.scss'

interface CounterAccordeonProps {
    chatCounter: number
    totalChats: number
}

const CounterAccordeon: React.FC<CounterAccordeonProps> = ({ chatCounter, totalChats }) => {
    return (
        <Box className={'new-sidebar__tab-container active'}>
            <span className='tab-counter'>
                <If test={chatCounter >= 0}>{totalChats}</If>
                <If test={chatCounter < 0}>{0}</If>
            </span>
        </Box>
    )
}

export default CounterAccordeon
