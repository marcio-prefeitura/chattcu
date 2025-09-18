import { useState } from 'react'

import { Box, Divider, Menu, MenuItem, Typography } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import { IChat } from '../../infrastructure/utils/types'
import { IUserInfo } from '../../hooks/useUserInfo'
import DeleteChatModel from '../delete-chat-modal/DeleteChatModel'
import EditChatModal from '../edit-chat-modal/EditChatModal'
import If from '../operator/if'

import './ChatActionsMenu.scss'
import '../../assets/icons/style.css'

interface SideBarProps {
    profile: IUserInfo
    chat: IChat | null
    handleFixOnTop: (chat: IChat) => void
    handleArchiveChat: (chat: IChat) => void
    handleStartShareChat: (chat: IChat) => void
    handleEditChat: (chat: IChat) => void
    handleDeleteChat: (chat: IChat) => void
    handleInputChange: (chatId: string, newTitle: string) => void
    isPinned: boolean
}

const ChatActionsMenu: React.FC<SideBarProps> = ({
    chat,
    handleFixOnTop,
    handleArchiveChat,
    handleStartShareChat,
    handleInputChange,
    handleEditChat,
    handleDeleteChat,
    isPinned
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [isOpenModalEditChat, setIsOpenModalEditChat] = useState<boolean>(false)
    const [isOpenModalDeleteChat, setIsOpenModalDeleteChat] = useState<boolean>(false)
    // Usado para posicionar o menu.
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    // Limpa o target do menu.
    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleShareClick = () => {
        handleStartShareChat(chat!)
        setAnchorEl(null)
    }
    const openModalEditChat = () => {
        setIsOpenModalEditChat(true)
        setAnchorEl(null)
    }

    const openModalDeletChat = () => {
        setIsOpenModalDeleteChat(true)
        setAnchorEl(null)
    }

    const handleDeleteAndCloseModal = () => {
        if (chat) {
            handleDeleteChat(chat)
            setIsOpenModalDeleteChat(false) // Feche o modal após a exclusão
        }
    }

    const handlePinUnpin = (chat: IChat) => {
        handleFixOnTop(chat)
        setAnchorEl(null)
    }

    const handleArchive = (chat: IChat) => {
        handleArchiveChat(chat)
        setAnchorEl(null)
    }

    if (!chat) {
        return null
    }
    return (
        <div className='chat-actions'>
            <IconButton
                size='small'
                aria-controls={`menu-${chat.id}`}
                aria-haspopup='true'
                onClick={handleMenuClick}
                data-testid={`menu-button-${chat.id}`}>
                <MoreVertIcon className='chat-actions__tres-pontos' />
            </IconButton>
            <EditChatModal
                openModalEditChat={isOpenModalEditChat}
                chat={chat}
                handleOpenModal={setIsOpenModalEditChat}
                handleEditChat={handleEditChat}
                handleInputChange={handleInputChange}
            />
            <DeleteChatModel
                openModalDeleteChat={isOpenModalDeleteChat}
                chat={chat}
                handleOpenModal={setIsOpenModalDeleteChat}
                handleDeleteChat={handleDeleteAndCloseModal}
            />
            <Menu
                className='chat-actions__menu'
                id={`menu-${chat.id}`}
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}>
                <If test={isPinned}>
                    <MenuItem
                        onClick={() => handlePinUnpin(chat)}
                        data-testid={`unpin-button-actions-${chat.id}`}
                        className='chat-actions__icone-desfixar'>
                        <Box className='chat-actions__box-acoes'>
                            <span
                                className='icon-pin-off'
                                key={chat.id}
                                aria-hidden='true'
                            />
                            <Typography className='chat-actions__texto'>Desafixar</Typography>
                        </Box>
                    </MenuItem>
                    <Divider variant='middle' />
                </If>
                <If test={!isPinned}>
                    <MenuItem
                        onClick={() => handlePinUnpin(chat)}
                        data-testid={`pin-button-${chat.id}`}
                        className='icone-fixar'>
                        <Box className='chat-actions__box-acoes'>
                            <span
                                className='icon-pin'
                                key={chat.id}
                                aria-hidden='true'
                            />
                            <Typography className='chat-actions__texto'>Fixar</Typography>
                        </Box>
                    </MenuItem>
                    <Divider variant='middle' />
                </If>
                <MenuItem
                    onClick={() => openModalEditChat()}
                    data-testid={`edit-button-${chat.id}`}
                    className='chat-actions__icone-editar'>
                    <Box className='chat-actions__box-acoes'>
                        <span className='icon-edit' />
                        <Typography className='chat-actions__texto'>Renomear</Typography>
                    </Box>
                </MenuItem>

                <Box>
                    <Divider
                        variant='middle'
                        className='divider-acoes'
                    />

                    <MenuItem
                        onClick={handleShareClick}
                        data-testid={`share-chat-button-${chat.id}`}
                        className='chat-actions__icone-share-chat'>
                        <Box className='chat-actions__box-acoes'>
                            <span className='icon-share' />
                            <Typography className='chat-actions__texto'>Compartilhar chat</Typography>
                        </Box>
                    </MenuItem>
                </Box>

                <Box>
                    <Divider
                        variant='middle'
                        className='divider-acoes'
                    />

                    <MenuItem
                        onClick={() => handleArchive(chat)}
                        data-testid={`archive-chat-button-${chat.id}`}
                        className='chat-actions__icone-share-chat'>
                        <Box className='chat-actions__box-acoes'>
                            <span className='icon-archive' />
                            <Typography className='chat-actions__texto'>Arquivar</Typography>
                        </Box>
                    </MenuItem>
                </Box>
                <Divider
                    variant='middle'
                    className='divider-acoes'
                />
                <MenuItem
                    onClick={() => openModalDeletChat()}
                    data-testid={`delete-button-${chat.id}`}
                    className='chat-actions__icone-deletar'>
                    <Box className='chat-actions__box-acoes'>
                        <span
                            className='icon-trash'
                            aria-hidden='true'
                        />
                        <Typography className='chat-actions__texto'>Excluir</Typography>
                    </Box>
                </MenuItem>
            </Menu>
        </div>
    )
}

export default ChatActionsMenu
