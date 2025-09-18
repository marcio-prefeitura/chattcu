import { useContext, useRef, useState } from 'react'

import { Box } from '@mui/material'

import { IChat } from '../../../infrastructure/utils/types'
import { InTeamsContext } from '../../../context/AppContext'
import { IUserInfo } from '../../../hooks/useUserInfo'
import FilterField from '../../filter-field/FilterField'
import MessageToast from '../../message-toast/MessageToast'
import ArchiveAccordion from './ArchiveAccordion'
import { useArchiveFunctions } from './ArchiveFunctions'

import './Archive.scss'
import { useAlert } from '../../../context/AlertContext'

interface IArchive {
    profile: IUserInfo
    isShow: boolean
    isMobile: boolean
    onChatClick: (chat: IChat | null) => void
    onUnArchiveChat: (chat: IChat) => void
    handleNewChat: () => void
}
const Archive: React.FC<IArchive> = ({ profile, onChatClick, onUnArchiveChat, handleNewChat }) => {
    const inTeams = useContext(InTeamsContext)
    const [query, setQuery] = useState<string>('')
    const shouldRefresh = useRef<boolean>()
    shouldRefresh.current = true
    const { alert } = useAlert()

    const { archiveChats, handleScroll, isLoadingNextPage, deleteChat, unarchiveAllArchives, totalArquivedChats } =
        useArchiveFunctions(query, null, handleNewChat)
    return (
        <>
            {/* <Box> */}
            {/* <Box className='newsidebar__filtro-compartilhadas'>
                    <FilterField
                        query={query}
                        title=''
                        onFilterChange={setQuery}
                        placeholder='Filtrar arquivados'
                        icon_position='start'
                    />
                </Box> */}
            <Box
                className={`sidebar__container sharing__container ${inTeams ? 'sharing__container__teams' : ''}`}
                onScroll={e => handleScroll(e)}
                data-testid='archive-content'>
                <Box className='archive__main'>
                    <FilterField
                        query={query}
                        title=''
                        onFilterChange={setQuery}
                        placeholder='Filtrar compartilhados'
                        icon_position='start'
                    />
                    <ArchiveAccordion
                        title='Chats arquivados'
                        chats={archiveChats}
                        isLoading={isLoadingNextPage}
                        totalArquivedChats={totalArquivedChats}
                        onChatClick={onChatClick}
                        onClickAllUnArchive={unarchiveAllArchives}
                        onUnArchive={onUnArchiveChat}
                        profile={profile}
                        handleDeleteChat={deleteChat}
                    />
                </Box>
            </Box>
            {/* </Box> */}
            <Box className='new-sidebar__alert'>{alert && <MessageToast {...alert} />}</Box>
        </>
    )
}

export default Archive
