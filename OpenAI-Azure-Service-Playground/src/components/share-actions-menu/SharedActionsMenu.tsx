import { useState } from 'react'

import { Box, Divider, Menu, MenuItem, Typography } from '@mui/material'
import { MoreVertRounded } from '@mui/icons-material'
import IconButton from '@mui/material/IconButton'

import { ISharedChat } from '../../infrastructure/utils/types'
import useAlert from '../../utils/AlertUtils'
import { handleCopyLink } from '../sidebar/sharing/ClipBoardUtils'
import MessageToast from '../message-toast/MessageToast'

import '../../assets/icons/style.css'

export enum SharedActionMenuType {
    SENT = 'sent',
    RECEIVED = 'received'
}

interface SideBarProps {
    item: ISharedChat
    onDeleteItem: (item: ISharedChat) => void
    type: SharedActionMenuType
}

const SharedActionsMenu: React.FC<SideBarProps> = ({ type, item, onDeleteItem }) => {
    const [anchorElItem, setAnchorElItem] = useState(null)
    const { alert, handleAlert } = useAlert()

    const handleClickItem = event => {
        event.stopPropagation()
        setAnchorElItem(event.currentTarget)
    }

    const handleCloseItem = event => {
        event.stopPropagation()
        setAnchorElItem(null)
    }

    const handleCopy = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation() // Evita que o clique no ícone afete o clique no chat
        handleCopyLink(item.id, handleAlert)
        handleCloseItem(event)
    }

    return (
        <>
            <Box>
                <IconButton
                    size='small'
                    data-testid='more-button'
                    onClick={handleClickItem}
                    className='more-icon'>
                    <MoreVertRounded />
                </IconButton>
                <Menu
                    className='sidebar__menu'
                    anchorEl={anchorElItem}
                    open={Boolean(anchorElItem)}
                    onClose={handleCloseItem}>
                    {type === SharedActionMenuType.SENT && (
                        <MenuItem onClick={handleCopy}>
                            <Box
                                className='sidebar__item-teste'
                                data-testid='item-teste-button'
                                color='secondary'>
                                <span className='icon-link' />

                                <Typography className='sidebar__texto'>Copiar link</Typography>
                            </Box>
                        </MenuItem>
                    )}
                    <Divider variant='middle' />
                    <MenuItem onClick={handleCloseItem}>
                        <Box
                            className='sidebar__item-teste'
                            data-testid='item-teste-button'
                            color='secondary'
                            onClick={() => onDeleteItem(item)}>
                            <span className='icon-trash' />
                            {type === SharedActionMenuType.SENT ? (
                                <Typography className='sidebar__texto'>Revogar link</Typography>
                            ) : (
                                <Typography className='sidebar__texto'>Excluir chat recebido</Typography>
                            )}
                        </Box>
                    </MenuItem>
                </Menu>
            </Box>
            <Box className='new-sidebar__alert'>{alert && <MessageToast {...alert} />}</Box>
        </>
    )
}

export default SharedActionsMenu
