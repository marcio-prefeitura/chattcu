import { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Box } from '@mui/material'

import { IChat } from '../../../infrastructure/utils/types'
import { useAlert } from '../../../context/AlertContext'
import { InTeamsContext } from '../../../context/AppContext'
import { IUserInfo } from '../../../hooks/useUserInfo'
import DialogGeneric from '../../dialog-generic/DialogGeneric'
import FilterField from '../../filter-field/FilterField'
import MessageToast from '../../message-toast/MessageToast'
import If from '../../operator/if'
import { useArchiveFunctions } from '../archive/ArchiveFunctions'
import AgentAccordion from './AgentAccordion'
import HistoryAccordion from './HistoryAccordion'
import { useHistoryContentFunctions } from './historyContentFunctions'

interface IHistoryContentProps {
    profile: IUserInfo
    agentsExpanded: boolean
    fixadoExpanded: boolean
    recenteExpanded: boolean
    setAgentsExpanded: React.Dispatch<React.SetStateAction<boolean>>
    setFixadoExpanded: React.Dispatch<React.SetStateAction<boolean>>
    setRecenteExpanded: React.Dispatch<React.SetStateAction<boolean>>

    handleClick: (event: any) => void
    handleClick2: (event: any) => void
    handleClose: () => void
    handleClose2: () => void
    handleStartShareChat: (chat: IChat) => void

    handleChatClick: (chat: IChat) => void
    handlEditChat: (chat: IChat) => Promise<void>
    handleInputChange: (chatId: string, newTitle: string) => void
    handleShowDeleteFixedModal: () => void

    anchorEl: any
    anchorEl2: any

    setSelectedAgent: any
    isArchive: boolean
    handleNewChat: () => void
    activeChat: IChat | null
    isAgentSelectionEnabled: boolean
    setIsModelLocked: React.Dispatch<React.SetStateAction<boolean>>
}
const HistoryContent: React.FC<IHistoryContentProps> = ({
    profile,
    agentsExpanded,
    fixadoExpanded,
    recenteExpanded,
    setAgentsExpanded,
    setFixadoExpanded,
    setRecenteExpanded,

    handleClick,
    handleClick2,
    handleClose,
    handleClose2,
    handleStartShareChat,
    handleChatClick,
    handlEditChat,
    handleInputChange,
    handleShowDeleteFixedModal,

    anchorEl,
    anchorEl2,

    setSelectedAgent,
    isArchive,
    handleNewChat,
    activeChat,
    isAgentSelectionEnabled,
    setIsModelLocked
}) => {
    const params = useParams()
    const { chat_id: urlChatId } = params

    const inTeams = useContext(InTeamsContext)

    // Inicio
    const [searchText, setSearchText] = useState<string>('')
    const { alert } = useAlert()

    const {
        openModalDeleteAllFixed,
        setOpenModalDeleteAllFixed,
        openModalDeleteAllRecent,
        setOpenModalDeleteAllRecent,
        openModalUnfixedOrFixedAll,
        setOpenModalUnfixedOrFixedAll,
        handleScroll,
        fixOrUpinChat,
        deleteChat,
        handleConfirmClearAll,
        handleClearPinnedConversations,
        handleClearRecentsConversations,
        fixedData,
        recentData,
        isLoadingRecentChats,
        isLoadingFixedChats,
        isFetchingNextFixedPage,
        isFetchingNextRecentPage
    } = useHistoryContentFunctions(handleNewChat, searchText, activeChat)

    const { handleArchiveChat } = useArchiveFunctions('', activeChat, handleNewChat)
    // Fim
    return (
        <Box
            className={`new-sidebar__message-list ${inTeams ? 'new-sidebar__message-list__teams' : ''}`}
            onScroll={e => handleScroll(e)}
            data-testid='history-content'>
            <If test={true}>
                <Box
                    className='new-sidebar__chat-agents'
                    data-testid='accordion-agents'>
                    <AgentAccordion
                        profile={profile}
                        onChange={() => setAgentsExpanded(prevState => !prevState)}
                        expanded={agentsExpanded}
                        summaryAriaControls='panel0a-content'
                        summaryId='panel0a-header'
                        summaryClassName=''
                        summaryClassNameTitle='new-sidebar__titulo-agents'
                        summaryTitle='Especialistas'
                        setSelectedAgent={setSelectedAgent}
                        isArchive={isArchive}
                        isDisabled={!isAgentSelectionEnabled}
                        handleNewChat={handleNewChat}
                        setIsModelLocked={setIsModelLocked}
                    />
                </Box>
                <Box
                    className='new-sidebar__message-list__fixados-recentes'
                    data-testid='fixed-recent-container'>
                    <Box className='newsidebar__fixados-recentes-filtro'>
                        <FilterField
                            data-testid='filter-field'
                            query={searchText}
                            title=''
                            onFilterChange={setSearchText}
                            placeholder='Filtrar recentes ou fixados'
                            icon_position='start'
                        />
                    </Box>
                    <If
                        test={
                            (isLoadingRecentChats || isLoadingFixedChats) &&
                            (recentData?.pages.flatMap(page => page.chats) || []).length === 0 &&
                            (fixedData?.pages.flatMap(page => page.chats) || []).length === 0
                        }>
                        <Box
                            className={`new-sidebar__message-list ${
                                inTeams ? 'new-sidebar__message-list__teams' : ''
                            }`}>
                            <Box
                                className='new-sidebar__nenhum-arquivo'
                                data-testid='loading-message'>
                                <p>Carregando Chats...</p>
                            </Box>
                        </Box>
                    </If>
                    <If
                        test={
                            !(isLoadingFixedChats && isLoadingRecentChats) &&
                            (recentData?.pages.flatMap(page => page.chats) || []).length === 0 &&
                            (fixedData?.pages.flatMap(page => page.chats) || []).length === 0
                        }>
                        <Box
                            className='new-sidebar__nenhum-arquivo'
                            data-testid='no-results-message'>
                            <Box className='icon-alert-triangle' />
                            <p className=''>Nenhum Resultado Encontrado</p>
                        </Box>
                    </If>
                    <If test={(fixedData?.pages.flatMap(page => page.chats) || []).length > 0}>
                        <HistoryAccordion
                            isFixeds
                            profile={profile}
                            selectedChatId={urlChatId || null}
                            onChange={() => setFixadoExpanded(prevState => !prevState)}
                            expanded={fixadoExpanded}
                            chats={fixedData?.pages.flatMap(page => page.chats) || []}
                            summaryAriaControls='panel1a-content'
                            summaryId='panel1a-header'
                            summaryClassName=''
                            summaryClassNameTitle='new-sidebar__titulo-fixados'
                            summaryTitle='Fixados'
                            counter={fixedData?.pages[0]?.total || 0}
                            handleClick={handleClick2}
                            anchorEl={anchorEl2}
                            handleClose={handleClose2}
                            handleOpenConfirmClearAllDialog={() => setOpenModalUnfixedOrFixedAll(true)}
                            handleChatClick={handleChatClick}
                            fixChatOnTop={fixOrUpinChat}
                            handleArchiveChat={handleArchiveChat}
                            handleStartShareChat={handleStartShareChat}
                            handleInputChange={handleInputChange}
                            handlEditChat={handlEditChat}
                            handleDeleteChat={deleteChat}
                            handleShowDeleteFixedModal={() => setOpenModalDeleteAllFixed(true)}
                            isLoadingNextPage={isLoadingFixedChats || isFetchingNextFixedPage}
                            activeChat={activeChat}
                        />
                    </If>

                    <If test={(recentData?.pages.flatMap(page => page.chats) || []).length > 0}>
                        <HistoryAccordion
                            profile={profile}
                            selectedChatId={urlChatId || null}
                            onChange={() => setRecenteExpanded(prevState => !prevState)}
                            expanded={recenteExpanded}
                            chats={recentData?.pages.flatMap(page => page.chats) || []}
                            summaryAriaControls='panel2a-content'
                            summaryId='panel2a-header'
                            summaryClassName='accordionSummaryRecentes'
                            summaryClassNameTitle='new-sidebar__titulo-recentes'
                            summaryTitle='Recentes'
                            counter={recentData?.pages[0]?.total || 0}
                            handleClick={handleClick}
                            anchorEl={anchorEl}
                            handleClose={handleClose}
                            handleShowModal={() => setOpenModalDeleteAllRecent(true)}
                            handleOpenConfirmClearAllDialog={() => setOpenModalUnfixedOrFixedAll(true)}
                            handleChatClick={handleChatClick}
                            handleArchiveChat={handleArchiveChat}
                            fixChatOnTop={fixOrUpinChat}
                            handleStartShareChat={handleStartShareChat}
                            handleInputChange={handleInputChange}
                            handlEditChat={handlEditChat}
                            handleDeleteChat={deleteChat}
                            handleShowDeleteFixedModal={handleShowDeleteFixedModal}
                            isLoadingNextPage={isLoadingRecentChats || isFetchingNextRecentPage}
                            activeChat={activeChat}
                        />
                    </If>
                </Box>

                <DialogGeneric
                    data-testid='unfix-all-modal'
                    open={openModalUnfixedOrFixedAll}
                    onClose={() => setOpenModalUnfixedOrFixedAll(false)}
                    titulo='Desafixar todos os chats'
                    conteudo='Tem certeza que deseja desafixar todos os chats e movê-las para a seção "Recentes"?'
                    icone='icon-pin-off'
                    onCancel={() => setOpenModalUnfixedOrFixedAll(false)}
                    onConfirm={handleConfirmClearAll}
                    cancelText='Cancelar'
                    confirmText='Confirmar'
                />

                <DialogGeneric
                    data-testid='delete-fixed-modal'
                    open={openModalDeleteAllFixed}
                    onClose={() => setOpenModalDeleteAllFixed(false)}
                    titulo='Excluir todos os chats Fixadas'
                    conteudo={
                        <>
                            Tem certeza que deseja excluir todos os chats fixadas?
                            <br />
                            <br />
                            Ao excluir todos os chats, caso haja compartilhamento, os links serão revogados.
                        </>
                    }
                    icone='icon-trash'
                    onCancel={() => setOpenModalDeleteAllFixed(false)}
                    onConfirm={() => handleClearPinnedConversations()}
                    cancelText='Cancelar'
                    confirmText='Confirmar'
                />
                <DialogGeneric
                    data-testid='delete-recent-modal'
                    open={openModalDeleteAllRecent}
                    onClose={() => setOpenModalDeleteAllRecent(false)}
                    titulo='Excluir todos os chats Recentes'
                    conteudo={
                        <>
                            Tem certeza que deseja excluir todos os chats recentes?
                            <br />
                            <br />
                            Ao excluir todos os chats, caso haja compartilhamento, os links serão revogados.
                        </>
                    }
                    icone='icon-trash'
                    onCancel={() => setOpenModalDeleteAllRecent(false)}
                    onConfirm={() => handleClearRecentsConversations()}
                    cancelText='Cancelar'
                    confirmText='Confirmar'
                />
            </If>
            <Box
                className='new-sidebar__alert'
                data-testid='alert-container'>
                {alert && <MessageToast {...alert} />}
            </Box>
        </Box>
    )
}

export default HistoryContent
