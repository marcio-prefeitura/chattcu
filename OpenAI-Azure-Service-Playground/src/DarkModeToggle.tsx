import React from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined'
import './DarkModeToggle.scss'

interface DarkModeToggleProps {
    darkMode: boolean
    onToggleDarkMode: () => void
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ darkMode, onToggleDarkMode }) => {
    const tooltipText = darkMode ? 'Modo claro' : 'Modo escuro'

    return (
        <Tooltip
            title={tooltipText}
            arrow>
            <IconButton
                className='dark-mode__icon'
                color='inherit'
                onClick={onToggleDarkMode}>
                {darkMode ? <WbSunnyOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
        </Tooltip>
    )
}

export default DarkModeToggle
