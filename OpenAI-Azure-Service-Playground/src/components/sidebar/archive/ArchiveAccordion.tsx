import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    CircularProgress,
    List,
    ListItemButton,
    Tooltip,
    Typography
} from '@mui/material'
import moment from 'moment-timezone'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import ArrowDropUpIcon from '@mui/icons-material/ExpandLessTwoTone'
import ArrowRightIcon from '@mui/icons-material/ChevronRightTwoTone'

import { IChat } from '../../../infrastructure/utils/types'
import { IUserInfo } from '../../../hooks/useUserInfo'
import ArchiveActionsMenu from '../../archive-actions-menu/ArchiveActionsMenu'
import CounterAccordeon from '../../counter-accordeon/CounterAccordeon'
import AccordionMenu from '../../accordion-menu/AccordionMenu'

interface ArchiveAccordionProps {
    profile: IUserInfo
    title: string
    chats: IChat[]
    isLoading: boolean
    isError?: boolean
    onChatClick: (chat: IChat) => void
    onClickAllUnArchive: () => void
    onUnArchive: (item: IChat) => void
    handleDeleteChat: (chat: IChat) => Promise<void>
    totalArquivedChats: number
}

const ArchiveAccordion: React.FC<ArchiveAccordionProps> = ({
    title,
    chats,
    isLoading,
    onChatClick,
    onClickAllUnArchive,
    onUnArchive,
    handleDeleteChat,
    totalArquivedChats
}) => {
    const [expanded, setExpanded] = useState<boolean>(true)
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const { chat_id } = useParams()

    const formatDateString = (dateString: Date | undefined) => {
        if (dateString) {
            const date = moment.utc(dateString, 'YYYY-MM-DD HH:mm:ss').tz('America/Sao_Paulo')
            return date.format('DD/MM/YYYY - HH[h]mm')
        }
    }
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
    }

    const handleClose = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        setAnchorEl(null)
    }

    const chatCounter = isLoading ? 0 : totalArquivedChats

    return (
        <Accordion
            expanded={expanded}
            onChange={() => setExpanded(prev => !prev)}>
            <Box className='new-sidebar__title-accordion'>
                <AccordionSummary
                    className='accordionSummary'
                    expandIcon={
                        expanded ? (
                            <ArrowDropUpIcon className='icone-enviadas-recebidas' />
                        ) : (
                            <ArrowRightIcon className='icone-enviadas-recebidas' />
                        )
                    }
                    aria-controls='panel-content'
                    id='panel-header'>
                    <Typography className='sidebar__titulo-fixados'>{title}</Typography>
                    <CounterAccordeon
                        chatCounter={chatCounter}
                        totalChats={totalArquivedChats}
                    />
                    <AccordionMenu
                        handleClick={handleClick}
                        anchorEl={anchorEl}
                        chatCounter={chatCounter}
                        handleClose={handleClose}
                        onClickDeleteAll={onClickAllUnArchive}
                        titleDeleteAll={'Desarquivar todos os chats'}
                    />
                </AccordionSummary>
            </Box>
            <AccordionDetails>
                <List>
                    <div>
                        {chats.length > 0 ? (
                            chats.map((item: IChat) => {
                                return (
                                    <ListItemButton
                                        className='archive-chat-item'
                                        key={item.id}
                                        selected={chat_id === item.id}>
                                        <Box className='sidebar__chat-list-name'>
                                            <Box onClick={() => onChatClick(item)}>
                                                <Tooltip
                                                    placement='top'
                                                    title={item.titulo}
                                                    arrow>
                                                    <p className='new-sidebar__title'>{item.titulo}</p>
                                                </Tooltip>
                                                <Box>
                                                    <p className='new-sidebar__datehours'>
                                                        {formatDateString(item.data_ultima_iteracao)}
                                                    </p>
                                                </Box>
                                            </Box>
                                            <Box className='new-sidebar__icones'>
                                                <ArchiveActionsMenu
                                                    chat={item}
                                                    handleDeleteChat={handleDeleteChat}
                                                    onUnArchive={onUnArchive}
                                                />
                                            </Box>
                                        </Box>
                                    </ListItemButton>
                                )
                            })
                        ) : (
                            <div className='new-file-upload__nenhum-arquivo'>
                                <div className='icon-alert-triangle' />
                                <p className=''>Nenhum Resultado Encontrado</p>
                            </div>
                        )}
                    </div>
                    {isLoading && (
                        <CircularProgress
                            disableShrink
                            className='loading-message'
                        />
                    )}
                </List>
            </AccordionDetails>
        </Accordion>
    )
}

export default ArchiveAccordion
