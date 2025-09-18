import { useState } from 'react'

import { CssBaseline, IconButton, Tooltip, Typography } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar'

import { IUserInfo } from '../../hooks/useUserInfo'
import DarkModeToggle from '../../DarkModeToggle'
import AvatarMenu from './AvatarMenu'
import NotificationDialog from './NotificationDialog'

import './Header.scss'

interface IHeaderProps {
    profile: IUserInfo

    onClickShowSidebar: (isToggleSidebarClick?: any) => void
    toggleDarkMode: any
    darkMode: boolean
}

const Header: React.FC<IHeaderProps> = ({ profile, onClickShowSidebar, toggleDarkMode, darkMode }) => {
    const [openNotification, setOpenNotification] = useState(false)

    return (
        <>
            <CssBaseline />
            <AppBar
                color='default'
                className={'toolbar'}
                position='fixed'
                sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
                <Toolbar
                    disableGutters
                    className='toolbar__itens'>
                    <Box className='toolbar__item-left'>
                        <IconButton
                            data-testid='menu-button'
                            aria-controls='menu-appbar'
                            aria-haspopup='true'
                            aria-label='account of current user'
                            color='inherit'
                            size='medium'
                            onClick={() => onClickShowSidebar(true)}>
                            <MenuIcon
                                className='toolbar__icon-menu'
                                aria-label='iconemenu'
                            />
                        </IconButton>
                        <Link
                            href='/'
                            className='logo'>
                            <div className='logo' />
                        </Link>
                        <Typography variant='h6'>
                            <Link
                                href='/'
                                className='toolbar__titulo'>
                                ChatTCU
                            </Link>
                        </Typography>
                    </Box>
                    <Box className='toolbar__dark-login'>
                        <DarkModeToggle
                            darkMode={darkMode}
                            onToggleDarkMode={toggleDarkMode}
                        />
                        <Tooltip
                            title='Novidades'
                            arrow>
                            <IconButton
                                aria-label=''
                                onClick={() => setOpenNotification(true)}>
                                <span className='icon-bell' />
                            </IconButton>
                        </Tooltip>
                        <Box>
                            <AvatarMenu profile={profile} />
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>
            <NotificationDialog
                open={openNotification}
                onClose={() => setOpenNotification(false)}
            />
        </>
    )
}
export default Header
