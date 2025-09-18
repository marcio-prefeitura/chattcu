import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    List,
    ListItemButton,
    Tooltip,
    Typography
} from '@mui/material'
import moment from 'moment'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import ArrowDropUpIcon from '@mui/icons-material/ExpandLessTwoTone'
import ArrowRightIcon from '@mui/icons-material/ChevronRightTwoTone'

import { ISharedChat } from '../../../infrastructure/utils/types'
import { IUserInfo } from '../../../hooks/useUserInfo'
import SharedActionsMenu, { SharedActionMenuType } from '../../share-actions-menu/SharedActionsMenu'
import CounterAccordeon from '../../counter-accordeon/CounterAccordeon'
import AccordionMenu from '../../accordion-menu/AccordionMenu'

interface ShareAccordionProps {
    title: string
    chats: ISharedChat[]
    isLoading: boolean
    isError: boolean
    profile?: IUserInfo
    onClickDeleteAll: () => void
    onDeleteItem: (item: ISharedChat) => void
    onRefresh: () => void
    onChatClick: (sharedChat: ISharedChat) => void
}

const SharingAccordion: React.FC<ShareAccordionProps> = ({
    title,
    chats,
    isLoading,
    isError,
    onClickDeleteAll,
    onDeleteItem,
    onChatClick
}) => {
    const [expanded, setExpanded] = useState<boolean>(true)
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    const { share_id } = useParams()

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

    const chatCounter = isLoading ? 0 : chats.length

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
                        totalChats={chatCounter}
                    />
                    <AccordionMenu
                        handleClick={handleClick}
                        anchorEl={anchorEl}
                        chatCounter={chatCounter}
                        handleClose={handleClose}
                        onClickDeleteAll={onClickDeleteAll}
                        titleDeleteAll={'Revogar todos os Links'}
                    />
                </AccordionSummary>
            </Box>
            <AccordionDetails>
                <List>
                    {isLoading && <div className='info-text'>Carregando chats...</div>}
                    {isError && <div className='info-text'>Ocorreu um erro ao carregar chats</div>}
                    {!isLoading && !isError && (
                        <div>
                            {chats.length > 0 ? (
                                chats.map((item: ISharedChat) => {
                                    const { titulo } = item.chat

                                    return (
                                        <ListItemButton
                                            className='share-chat-item'
                                            key={item.id}
                                            onClick={() => onChatClick(item)}
                                            selected={share_id === item.id}>
                                            <Box className='sidebar__chat-list-name'>
                                                <Box>
                                                    <Tooltip
                                                        placement='top'
                                                        title={titulo}
                                                        arrow>
                                                        <p className='new-sidebar__title'>{titulo}</p>
                                                    </Tooltip>

                                                    <Box>
                                                        <p className='new-sidebar__datehours'>
                                                            {formatDateString(item.data_compartilhamento)}
                                                        </p>
                                                    </Box>
                                                </Box>
                                                <Box className='new-sidebar__icones'>
                                                    <SharedActionsMenu
                                                        type={SharedActionMenuType.SENT}
                                                        item={item}
                                                        onDeleteItem={onDeleteItem}
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
                    )}
                </List>
            </AccordionDetails>
            {/*<Box className='new-sidebar__alert'>{alert && <MessageToast {...alert} />}</Box>*/}
        </Accordion>
    )
}

export default SharingAccordion
