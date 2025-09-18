import { useContext, useState } from 'react'

import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import { Logout } from '@mui/icons-material'
import { ListItemIcon } from '@mui/material'
import If from '../operator/if'
import './Header.scss'
import { IUserInfo } from '../../hooks/useUserInfo'
import { InTeamsContext } from '../../context/AppContext'
import { logOut } from '../../browser-auth'
interface IAvatarMenu {
    profile: IUserInfo
}

const AvatarMenu: React.FC<IAvatarMenu> = ({ profile }) => {
    const inTeams = useContext(InTeamsContext)
    const [anchorElUser, setAnchorElUser] = useState(null)

    const executeLogOut = async () => {
        await logOut()
        handleCloseUserMenu()
    }

    const handleOpenUserMenu = event => {
        setAnchorElUser(event.currentTarget)
    }

    const handleCloseUserMenu = () => {
        setAnchorElUser(null)
    }

    return (
        <Box className='avatar-menu'>
            <Tooltip title={profile.name || 'Opções'}>
                <IconButton
                    data-testid='iconButtonMenu'
                    onClick={handleOpenUserMenu}>
                    <Avatar>{profile.initialLetters}</Avatar>
                </IconButton>
            </Tooltip>
            <If test={!inTeams}>
                <Menu
                    id='menu-appbar'
                    anchorEl={anchorElUser}
                    keepMounted
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}>
                    <MenuItem
                        data-testid='itemMenuSair'
                        onClick={() => executeLogOut()}>
                        <ListItemIcon>
                            <Logout className='avatar-menu__icon' />
                        </ListItemIcon>
                        Sair
                    </MenuItem>
                </Menu>
            </If>
        </Box>
    )
}

export default AvatarMenu
