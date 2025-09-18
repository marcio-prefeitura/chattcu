import { useEffect, useState } from 'react'

import { Box, Button, Divider, IconButton, Tooltip } from '@mui/material'

import { ContentType } from '../../../shared/types/content-type'
import { IUserInfo } from '../../../hooks/useUserInfo'
import If from '../../operator/if'
import SidebarSwitcherItem from './SidebarSwitcherItem'

import './SidebarSwitcher.scss'

interface ISidebarSwitcher {
    profile: IUserInfo
    selected: ContentType
    onClickNewChat: () => void
    onContentTypeChange: (contentType: ContentType) => void
}

const SidebarSwitcher: React.FC<ISidebarSwitcher> = ({ selected, onClickNewChat, onContentTypeChange, profile }) => {
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 1366)

    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth > 1366)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <Box
            sx={{ flexDirection: 'column' }}
            //className='new-sidebar__switcher'> aqui = perfil normal
            className={`new-sidebar-switcher ${profile?.perfilDev ? 'dev-mode' : 'new-sidebar__switcher'}`}>
            <Tooltip
                title='Novo chat'
                placement='right-start'
                arrow>
                <Box className='new-sidebar-switcher__nova-conversa'>
                    <IconButton
                        data-testid='new-chat'
                        className='new-sidebar-switcher__nova-conversa--botao'
                        color='primary'
                        onClick={onClickNewChat}>
                        {isLargeScreen && profile?.perfilDev ? (
                            <Button
                                variant='contained'
                                disableElevation>
                                <span className='icon-plus' />
                                Novo chat
                            </Button>
                        ) : (
                            <span className='icon-button-plus' />
                        )}
                    </IconButton>
                </Box>
            </Tooltip>
            <Divider className='divisor' />
            <SidebarSwitcherItem
                label='Chats'
                contentType='history'
                className={selected === 'history' ? 'selected' : ''}
                icon={<span className='icon-message-square' />}
                onContentTypeChange={onContentTypeChange}
                isExpanded={isLargeScreen}
            />
            <SidebarSwitcherItem
                label='Arquivos'
                contentType='files'
                className={selected === 'files' ? 'selected' : ''}
                icon={<span className='icon-paper-clip' />}
                onContentTypeChange={onContentTypeChange}
                isExpanded={isLargeScreen}
            />
            <SidebarSwitcherItem
                label='Compartilhados'
                contentType='share'
                className={selected === 'share' ? 'selected' : ''}
                icon={<span className='icon-share' />}
                onContentTypeChange={onContentTypeChange}
                isExpanded={isLargeScreen}
            />
            <SidebarSwitcherItem
                label='Arquivados'
                contentType='archive'
                className={selected === 'archive' ? 'selected' : ''}
                icon={<span className='icon-archive' />}
                onContentTypeChange={onContentTypeChange}
                isExpanded={isLargeScreen}
            />

            <If test={profile?.perfilDev}>
                <SidebarSwitcherItem
                    label='Store'
                    contentType='store'
                    className={selected === 'store' ? 'selected' : ''}
                    icon={<span className='icon-storefront' />}
                    onContentTypeChange={onContentTypeChange}
                    isExpanded={isLargeScreen}
                />
            </If>
        </Box>
    )
}

export default SidebarSwitcher
