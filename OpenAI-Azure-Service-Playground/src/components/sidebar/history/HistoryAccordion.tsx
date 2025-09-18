import {
    Accordion,
    AccordionDetails,
    Box,
    CircularProgress,
    Divider,
    List,
    ListItemButton,
    Menu,
    MenuItem,
    Paper,
    Tooltip,
    Typography
} from '@mui/material'
import moment from 'moment-timezone'
import React from 'react'

import { IChat } from '../../../infrastructure/utils/types'
import { IUserInfo } from '../../../hooks/useUserInfo'
import AccordionSumary from '../../accordion-sumary/AccordionSumary'
import ChatActionsMenu from '../../chat-actions-menu/ChatActionsMenu'
import If from '../../operator/if'

interface IHistoryAccordionProps {
    profile: IUserInfo
    chats: IChat[]
    selectedChatId: string | null
    isFixeds?: boolean
    expanded: boolean
    onChange: () => void
    summaryClassName: string
    summaryTitle: string
    summaryClassNameTitle: string
    counter: number
    summaryAriaControls: string
    summaryId: string
    handleChatClick: (chat: IChat) => void
    fixChatOnTop: (chat: IChat) => void
    handleArchiveChat: (chat: IChat) => void
    handleStartShareChat: (chat: IChat) => void
    handleInputChange: (chatId: string, newTitle: string) => void
    handlEditChat: (chat: IChat) => Promise<void>
    handleDeleteChat: (chat: IChat) => Promise<void>
    activeChat: IChat | null
    handleClick: (event: any) => void
    anchorEl: any
    handleClose: () => void
    handleOpenConfirmClearAllDialog: () => void
    handleShowDeleteFixedModal: () => void
    handleShowModal?: () => void
    isLoadingNextPage: boolean
}

const HistoryAccordion: React.FC<IHistoryAccordionProps> = ({
    profile,
    chats,
    isFixeds = false,
    expanded,
    onChange,
    summaryClassName,
    summaryTitle,
    summaryClassNameTitle,
    counter,
    summaryAriaControls,
    summaryId,
    handleChatClick,
    fixChatOnTop,
    handleArchiveChat,
    handleStartShareChat,
    handleInputChange,
    handlEditChat,
    handleDeleteChat,
    activeChat,
    handleClick,
    anchorEl,
    handleClose,
    handleOpenConfirmClearAllDialog,
    handleShowDeleteFixedModal,

    handleShowModal,
    isLoadingNextPage
}) => {
    // const { chat_id } = useParams()
    const formatDateString = (dateString: Date | undefined) => {
        if (dateString) {
            const date = moment.utc(dateString, 'YYYY-MM-DD HH:mm:ss').tz('America/Sao_Paulo')
            return date.format('DD/MM/YYYY - HH[h]mm')
        }
    }
    return (
        <Paper>
            <Accordion
                expanded={expanded}
                onChange={() => onChange()}>
                <Box className='new-sidebar__title-accordion'>
                    <AccordionSumary
                        expanded={expanded}
                        counter={counter}
                        summaryClassName={summaryClassName}
                        summaryClassNameTitle={summaryClassNameTitle}
                        summaryAriaControls={summaryAriaControls}
                        handleClick={handleClick}
                        summaryId={summaryId}
                        summaryTitle={summaryTitle}
                        onChange={onChange}
                    />

                    <Box>
                        <If test={isFixeds}>
                            <Menu
                                className='new-sidebar__menu'
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}>
                                <MenuItem onClick={handleClose}>
                                    <Box
                                        className='new-sidebar__container-texto'
                                        data-testid='clear-all-button'
                                        color='secondary'
                                        onClick={handleOpenConfirmClearAllDialog}>
                                        <span className='icon-pin-off' />
                                        <Typography className='new-sidebar__texto'>Desafixar todos os chats</Typography>
                                    </Box>
                                </MenuItem>
                                <Divider variant='middle' />
                                <MenuItem onClick={handleClose}>
                                    <Box
                                        className='new-sidebar__container-texto'
                                        data-testid='clear-pinned-button'
                                        color='secondary'
                                        onClick={handleShowDeleteFixedModal}>
                                        <span className='icon-trash' />
                                        <Typography className='new-sidebar__texto'>
                                            Excluir todos os chats fixados
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            </Menu>
                        </If>
                        <If test={!isFixeds}>
                            <Menu
                                className='new-sidebar__menu'
                                keepMounted
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}>
                                <MenuItem onClick={handleClose}>
                                    <Box
                                        className='new-sidebar__container-texto'
                                        data-testid='clear-all-button'
                                        color='secondary'
                                        onClick={handleShowModal}>
                                        <span className='icon-trash' />
                                        <Typography className='new-sidebar__texto'>
                                            Excluir todos os chats recentes
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            </Menu>
                        </If>
                    </Box>
                </Box>
                <AccordionDetails>
                    <List sx={{ pt: '0', padding: '0' }}>
                        {chats.map(chat => (
                            <ListItemButton
                                key={`list-item-button-${chat.id}`}
                                selected={activeChat?.id === chat.id}>
                                <Box className='new-sidebar__chat-list-name'>
                                    <Box onClick={() => handleChatClick(chat)}>
                                        <Tooltip
                                            placement='top'
                                            title={chat.titulo}
                                            arrow>
                                            <p className='new-sidebar__title'>{chat.titulo}</p>
                                        </Tooltip>
                                        <Box>
                                            <p className='new-sidebar__datehours'>
                                                {formatDateString(chat.data_ultima_iteracao)}
                                            </p>
                                        </Box>
                                    </Box>
                                    <Box className='new-sidebar__icones'>
                                        <ChatActionsMenu
                                            profile={profile}
                                            chat={chat}
                                            handleFixOnTop={fixChatOnTop}
                                            handleArchiveChat={handleArchiveChat}
                                            handleStartShareChat={handleStartShareChat}
                                            handleInputChange={handleInputChange}
                                            handleEditChat={handlEditChat}
                                            handleDeleteChat={handleDeleteChat}
                                            isPinned={isFixeds}
                                        />
                                    </Box>
                                </Box>
                            </ListItemButton>
                        ))}
                        {isLoadingNextPage && (
                            <CircularProgress
                                disableShrink
                                className='loading-message'
                            />
                        )}
                    </List>
                </AccordionDetails>
            </Accordion>
        </Paper>
    )
}

export default HistoryAccordion
