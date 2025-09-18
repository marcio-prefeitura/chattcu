import React from 'react'

import { Box } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
// import { Chats, Lightning, Warning } from '@phosphor-icons/react'
import { ReactComponent as LogoInicial } from '../../assets/icone-texto-chat-tcu.svg'
import { IUserInfo } from '../../hooks/useUserInfo'
import { getAgentByValue, getAgenteSelecionadoDoCache } from '../sidebar/history/AgentAccordion'
import EmptyChat from '../empty-chat/CardMessage'
import If from '../operator/if'

import './Panel.scss'

interface PanelProps {
    profile: IUserInfo
    submitChatMessage: (manualPrompt?: string) => void
}

const Panel: React.FC<PanelProps> = (props: PanelProps) => {
    const { submitChatMessage } = props
    const queryClient = useQueryClient()
    let selectedAgent = getAgenteSelecionadoDoCache(queryClient)

    if (!selectedAgent) selectedAgent = getAgentByValue(queryClient, null)

    return (
        <If test={selectedAgent}>
            <Box className='panel'>
                <Box key={`box-info-${selectedAgent?.valueAgente}`}>
                    <>
                        <If test={selectedAgent?.valueAgente === null}>
                            <LogoInicial className='panel__img-logo' />
                        </If>
                        <If test={selectedAgent?.valueAgente !== null}>
                            <Box className='panel__agent'>
                                <Box className='panel__agent-icon'>
                                    <span className={selectedAgent?.icon} />
                                </Box>
                                <Box className='panel__agent-label'>{selectedAgent?.labelAgente}</Box>
                                <Box className='panel__agent-autor'>
                                    {' '}
                                    <Box className='icon-user' />
                                    {selectedAgent?.autor}
                                </Box>
                                <Box className='panel__agent-descricao'>{selectedAgent?.descricao}</Box>
                            </Box>
                        </If>
                    </>
                </Box>
                <Box
                    key={`box-quebra-gelo-${selectedAgent?.valueAgente}`}
                    className='panel__container-box '>
                    <If test={selectedAgent?.quebraGelo}>
                        {selectedAgent?.quebraGelo.map(item => (
                            <div key={item.toString().replace(/\s/g, '_')}>
                                <EmptyChat
                                    message={item.toString()}
                                    onClick={submitChatMessage}
                                    icone={undefined}
                                />
                            </div>
                        ))}
                    </If>
                </Box>
            </Box>
        </If>
    )
}

export default Panel
