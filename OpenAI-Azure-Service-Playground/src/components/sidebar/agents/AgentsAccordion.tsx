import {
    Accordion,
    AccordionDetails,
    Box,
    IconButton,
    ListItemButton,
    Menu,
    MenuItem,
    Paper,
    Tooltip,
    Typography
} from '@mui/material'
import moment from 'moment-timezone'
import React from 'react'
import { FixedSizeList } from 'react-window'

import { IChat } from '../../../infrastructure/utils/types'
import { AgentModel } from '../../../shared/interfaces/AgentModel'
import { IUserInfo } from '../../../hooks/useUserInfo'
import AccordionSumary from '../../accordion-sumary/AccordionSumary'
import ChatActionsMenu from '../../chat-actions-menu/ChatActionsMenu'

import '../sidebar-switcher/../NewSidebar.scss'

interface IAgentsAccordionProps {
    profile: IUserInfo
    chats: IChat[]
    selectedChatId: string | null
    expanded: boolean
    onChange: () => void
    summaryClassName: string
    summaryTitle: string
    summaryClassNameTitle: string
    summaryAriaControls: string
    summaryId: string
    handleChatClick: (chat: IChat) => void
    fixChatOnTop: (chat: IChat) => Promise<void>
    handleArchiveChat: (chat: IChat) => void
    handleStartShareChat: (chat: IChat) => void
    handleInputChange: (chatId: string, newTitle: string) => void
    handlEditChat: (chat: IChat) => Promise<void>
    handleDeleteChat: (chat: IChat) => Promise<void>

    handleClick: (event: any) => void
    anchorEl: any
    handleClose: () => void
    handleOpenConfirmClearAllDialog: () => void
    handleShowDeleteFixedModal: () => void
    handleShowModal?: () => void

    setSelectedAgent: any
    setAgentList: any
    selectedAgent: AgentModel | undefined
    agentList: AgentModel[] | []
}

const AgentsAccordion: React.FC<IAgentsAccordionProps> = ({
    profile,
    chats,
    expanded,
    onChange,
    summaryClassName,
    summaryTitle,
    summaryClassNameTitle,
    summaryAriaControls,
    summaryId,
    handleChatClick,
    fixChatOnTop,
    handleArchiveChat,
    handleStartShareChat,
    handleInputChange,
    handlEditChat,
    handleDeleteChat,

    handleClick,
    anchorEl,
    handleClose,
    handleOpenConfirmClearAllDialog,
    handleShowDeleteFixedModal,

    selectedChatId,

    agentList
}) => {
    const formatDateString = (dateString: Date | undefined) => {
        if (dateString) {
            const date = moment.utc(dateString, 'YYYY-MM-DD HH:mm:ss').tz('America/Sao_Paulo')
            return date.format('DD/MM/YYYY - HH[h]mm')
        }
    }

    const renderRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const chat = chats[index]

        return (
            <ListItemButton
                className='new-sidebar__chat-list-name'
                selected={selectedChatId && selectedChatId === chat.id ? true : false}
                style={style}>
                <Box onClick={() => handleChatClick(chat)}>
                    <Tooltip
                        placement='top'
                        title={chat.titulo}
                        arrow>
                        <p className='new-sidebar__title'>{chat.titulo}</p>
                    </Tooltip>
                    <Box>
                        <p className='new-sidebar__datehours'>{formatDateString(chat.data_ultima_iteracao)}</p>
                    </Box>
                </Box>
                <Box className='new-sidebar__icones'>
                    <IconButton
                        data-testid={`unnopin-button-${chat.id}`}
                        className='new-sidebar__icone-fixados'
                        onClick={() => fixChatOnTop(chat)}>
                        <span className='icon-pin-off' />
                    </IconButton>

                    <ChatActionsMenu
                        profile={profile}
                        chat={chat}
                        handleFixOnTop={fixChatOnTop}
                        handleArchiveChat={handleArchiveChat}
                        handleStartShareChat={handleStartShareChat}
                        handleInputChange={handleInputChange}
                        handleEditChat={handlEditChat}
                        handleDeleteChat={handleDeleteChat}
                        isPinned={false}
                    />
                </Box>
            </ListItemButton>
        )
    }

    const counter = agentList.length

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
                            <MenuItem onClick={handleClose}>
                                <Box
                                    className='new-sidebar__container-texto'
                                    data-testid='clear-pinned-button'
                                    color='secondary'
                                    onClick={handleShowDeleteFixedModal}>
                                    <span className='icon-trash' />
                                    <Typography className='new-sidebar__texto'>
                                        Excluir todos os chat fixadas
                                    </Typography>
                                </Box>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>
                <AccordionDetails>
                    <FixedSizeList
                        height={Math.min(chats.length * 50, 330)}
                        className='new-sidebar__lista-fixado'
                        width='100%'
                        itemSize={50}
                        itemCount={chats.length}>
                        {renderRow}
                    </FixedSizeList>
                </AccordionDetails>
            </Accordion>
        </Paper>
    )
}

export default AgentsAccordion
