import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { AlertColor, Box, Toolbar } from '@mui/material'

import { IChat, ISharedChat } from '../../infrastructure/utils/types'
import { AgentModel } from '../../shared/interfaces/AgentModel'
import { ISelectedFiles } from '../../shared/interfaces/SelectedFiles'
import { ContentType } from '../../shared/types/content-type'
import { useAppTitle } from '../../hooks/useAppTitle'
import { IUserInfo } from '../../hooks/useUserInfo'
import useAlert from '../../utils/AlertUtils'
import MessageToast from '../message-toast/MessageToast'
import Archive from './archive/Archive'
import History from './history/History'
import Sharing from './sharing/Sharing'
import SidebarSwitcher from './sidebar-switcher/SidebarSwitcher'
import Upload from './upload/Upload'

import './NewSidebar.scss'

interface INewSidebar {
    profile: IUserInfo
    isShow: boolean
    isMobile: boolean
    chatsHistory: IChat[]
    isLoading: boolean
    isSuccess: boolean
    isFetching: boolean
    activeChat: IChat | null
    setActiveChat: any
    hasMoreChats: boolean
    onChatClick: (chat: IChat | null) => void
    updateChatHistory: React.Dispatch<React.SetStateAction<IChat[]>>
    hideSidebar: () => void
    updatedFoldersFromChipsActions: any[]
    filesSelected: ISelectedFiles[]
    setFilesSelected: React.Dispatch<React.SetStateAction<ISelectedFiles[]>>
    onAlert: (severity: AlertColor | undefined, MessageToast: string, duration?: number) => void
    onClickShowSidebar: (newState: boolean) => void
    onSharedChatSelect: (sharedChat: ISharedChat) => void
    onUnArchiveChat: (chat: IChat | null) => void
    isArchive: boolean
    isAgentSelectionEnabled: boolean
    setSelectedAgent: any
    selectedAgent: AgentModel | undefined
    setIsModelLocked: React.Dispatch<React.SetStateAction<boolean>>
    setRedirectForm: React.Dispatch<React.SetStateAction<boolean>>
}

const NewSidebar: React.FC<INewSidebar> = ({
    profile,
    isShow,
    isMobile,
    chatsHistory,
    isLoading,
    isSuccess,
    isFetching,
    activeChat,
    setActiveChat,
    hasMoreChats,
    onChatClick,
    updateChatHistory,
    hideSidebar,
    updatedFoldersFromChipsActions,
    filesSelected,
    setFilesSelected,
    onClickShowSidebar,
    onSharedChatSelect,
    onUnArchiveChat,
    setSelectedAgent,
    selectedAgent,
    isArchive,
    isAgentSelectionEnabled,
    setIsModelLocked,
    setRedirectForm
}) => {
    const pathname = useLocation()
    const router = useNavigate()
    const [searchParams] = useSearchParams()

    //resgata da url qual a tab está selecionada pelo usuário
    const tabValue = searchParams.get('tab') ?? 'history'

    const [selectedTab, setSelectedTab] = useState<ContentType>(tabValue as ContentType)

    const handleAppTitle = useAppTitle()
    const { alert } = useAlert()

    const handleTabChange = tabValue => {
        setSelectedTab(tabValue as ContentType)
        setRedirectForm(false)
        router(`${pathname.pathname}?tab=${tabValue}`)
        onClickShowSidebar(true)
    }

    const handleNewChat = () => {
        const path = tabValue ? `/?tab=${tabValue}` : '/'
        onChatClick(null)
        setIsModelLocked(false)
        handleAppTitle('ChatTCU Playground')
        hideSidebar()
        router(path)
        localStorage.removeItem('chat')
        window.dispatchEvent(new CustomEvent('handleNewChat'))
    }

    const handleSelectChat = (chat, type) => {
        if (type === 'archived') {
            onChatClick(chat)
        } else if (type === 'shared') {
            onSharedChatSelect(chat)
        }
        hideSidebar()
    }

    useEffect(() => {
        setSelectedTab(tabValue as ContentType)
    }, [tabValue])

    const renderSidebar = () => {
        switch (selectedTab) {
            case 'files':
                return (
                    <Upload
                        profile={profile}
                        updatedFoldersFromChipsActions={updatedFoldersFromChipsActions}
                        filesSelected={filesSelected}
                        setFilesSelected={setFilesSelected}
                        setSelectedAgent={setSelectedAgent}
                        selectedAgent={selectedAgent}
                    />
                )
            case 'share':
                return (
                    <Sharing
                        onSharedChatSelect={chat => handleSelectChat(chat, 'shared')}
                        profile={profile}
                    />
                )
            case 'archive':
                return (
                    <Archive
                        profile={profile}
                        isShow={isShow}
                        isMobile={isMobile}
                        onChatClick={chat => handleSelectChat(chat, 'archived')}
                        onUnArchiveChat={onUnArchiveChat}
                        handleNewChat={handleNewChat}
                    />
                )
            case 'store':
            default:
                return (
                    <>
                        <History
                            profile={profile}
                            isShow={isShow}
                            isMobile={isMobile}
                            chatsHistory={chatsHistory}
                            isLoading={isLoading}
                            isSuccess={isSuccess}
                            isFetching={isFetching}
                            activeChat={activeChat}
                            setActiveChat={setActiveChat}
                            hasMoreChats={hasMoreChats}
                            onChatClick={onChatClick}
                            updateChatHistory={updateChatHistory}
                            hideSidebar={hideSidebar}
                            setSelectedAgent={setSelectedAgent}
                            isArchive={isArchive}
                            isAgentSelectionEnabled={isAgentSelectionEnabled}
                            setIsModelLocked={setIsModelLocked}
                        />
                        <Box className='new-sidebar__alert'>{alert && <MessageToast {...alert} />}</Box>
                    </>
                )
        }
    }

    const openFilesTab = () => {
        setSelectedTab('files')
        setTimeout(() => {
            onClickShowSidebar(true)
        }, 50)
    }

    useEffect(() => {
        const params = new URLSearchParams(pathname.search)
        if (params.get('tab') === 'files') {
            openFilesTab()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    return (
        <Box className='new-sidebar'>
            <Toolbar />
            <Box
                sx={{ flex: 1, flexDirection: 'row' }}
                className='new-sidebar__container'>
                <SidebarSwitcher
                    profile={profile}
                    selected={selectedTab}
                    onClickNewChat={handleNewChat}
                    onContentTypeChange={handleTabChange}
                />
                <Box sx={{ flex: 1 }}>{renderSidebar()}</Box>
            </Box>
        </Box>
    )
}

export default NewSidebar
