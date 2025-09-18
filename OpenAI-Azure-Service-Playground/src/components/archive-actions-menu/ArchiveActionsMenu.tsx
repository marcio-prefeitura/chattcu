import { useState } from 'react'

import IconButton from '@mui/material/IconButton'
import { IChat } from '../../infrastructure/utils/types'
import { Box, Divider, Menu, MenuItem, Typography } from '@mui/material'

import '../../assets/icons/style.css'

import { MoreVertRounded } from '@mui/icons-material'
import DeleteChatModel from '../delete-chat-modal/DeleteChatModel'

interface SideBarProps {
    chat: IChat
    handleDeleteChat
    onUnArchive: (item: IChat) => void
}

const ArchiveActionsMenu: React.FC<SideBarProps> = ({ chat, handleDeleteChat, onUnArchive }) => {
    const [anchorElItem, setAnchorElItem] = useState<HTMLElement | null>(null)
    const [isOpenModalDeleteChat, setIsOpenModalDeleteChat] = useState<boolean>(false)

    const handleClickItem = event => {
        event.stopPropagation()
        setAnchorElItem(event.currentTarget)
    }

    const handleCloseItem = event => {
        event.stopPropagation()
        setAnchorElItem(null)
    }

    const handleDeleteAndCloseModal = () => {
        if (chat) {
            handleDeleteChat(chat)
            setIsOpenModalDeleteChat(false) // Feche o modal após a exclusão
        }
    }
    const openModalDeletChat = () => {
        setIsOpenModalDeleteChat(true)
        setAnchorElItem(null)
    }

    return (
        <Box>
            <IconButton
                size='small'
                onClick={handleClickItem}
                className='more-icon'>
                <MoreVertRounded />
            </IconButton>
            <DeleteChatModel
                openModalDeleteChat={isOpenModalDeleteChat}
                chat={chat}
                handleOpenModal={setIsOpenModalDeleteChat}
                handleDeleteChat={handleDeleteAndCloseModal}
            />
            <Menu
                className='sidebar__menu'
                anchorEl={anchorElItem}
                data-testid={'menu-button'}
                open={Boolean(anchorElItem)}
                onClose={handleCloseItem}>
                <MenuItem
                    onClick={() => onUnArchive(chat)}
                    data-testid={`unarchive-button-${chat.id}`}
                    className='chat-actions__icone-deletar'>
                    <Box className='chat-actions__box-acoes'>
                        <span className='icon-unarchive' />
                        <Typography className='chat-actions__texto'>Desarquivar</Typography>
                    </Box>
                </MenuItem>
                <Divider variant='middle' />
                <MenuItem
                    onClick={() => openModalDeletChat()}
                    data-testid={`delete-button-${chat.id}`}
                    className='chat-actions__icone-deletar'>
                    <Box className='chat-actions__box-acoes'>
                        <span
                            className='icon-trash-2'
                            aria-hidden='true'
                        />
                        <Typography className='chat-actions__texto'>Excluir</Typography>
                    </Box>
                </MenuItem>
            </Menu>
        </Box>
    )
}

export default ArchiveActionsMenu
