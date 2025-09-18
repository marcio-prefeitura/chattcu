import React from 'react'
import { FixedSizeList } from 'react-window'

import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { Accordion, AccordionDetails, AccordionSummary, Box, ListItemButton, Paper } from '@mui/material'
import ArrowDropUpIcon from '@mui/icons-material/ExpandLessTwoTone'
import ArrowRightIcon from '@mui/icons-material/ChevronRightTwoTone'

import { AgentModel } from '../../../shared/interfaces/AgentModel'
import { IUserInfo } from '../../../hooks/useUserInfo'

import '../sidebar-switcher/../NewSidebar.scss'

export const atualizaAgenteSelecionadoNoCache = async (queryClient: QueryClient, agent: AgentModel | undefined) => {
    if (!agent) return
    const cachedData = queryClient.getQueryData<AgentModel[]>(['agents'])

    const newModels = cachedData?.map(a => ({
        ...a,
        selected: a.valueAgente === agent.valueAgente
    }))

    queryClient.setQueryData(['agents'], newModels)
}

export const getAgenteSelecionadoDoCache = (queryClient: QueryClient) => {
    const cachedData = queryClient.getQueryData<AgentModel[]>(['agents'])
    return cachedData?.find(agente => agente.selected)
}

export const getAgentByValue = (queryClient: QueryClient, value: any) => {
    if (value === undefined) {
        value = null
    }
    const cachedData = queryClient.getQueryData<AgentModel[]>(['agents'])
    return cachedData?.find(agente => agente.valueAgente === value)
}

interface IAgentAccordionProps {
    profile: IUserInfo
    expanded: boolean
    onChange: () => void
    summaryClassName: string
    summaryTitle: string
    summaryClassNameTitle: string
    summaryAriaControls: string
    summaryId: string

    setSelectedAgent: any
    isArchive: boolean
    isDisabled: boolean
    handleNewChat: () => void
    setIsModelLocked: React.Dispatch<React.SetStateAction<boolean>>
}

const AgentAccordion: React.FC<IAgentAccordionProps> = ({
    expanded,
    onChange,
    summaryClassName,
    summaryTitle,
    summaryClassNameTitle,
    summaryAriaControls,
    summaryId,

    setSelectedAgent,
    isArchive,
    isDisabled,
    handleNewChat,
    setIsModelLocked
}) => {
    const queryClient = useQueryClient()
    const agents = queryClient.getQueryData<AgentModel[]>(['agents'])?.filter(agent => agent.valueAgente)

    const handleSelect = async (agent: AgentModel) => {
        if (isDisabled || isArchive) {
            return
        }

        handleNewChat()

        await atualizaAgenteSelecionadoNoCache(queryClient, agent)
        setSelectedAgent(agent)
        setIsModelLocked(false)
    }

    const renderRow = ({ index }: { index: number }) => {
        if (!agents) return null

        const agent = agents[index]
        const { labelAgente, icon } = agent

        return (
            <ListItemButton
                className='new-sidebar__chat-list-name'
                disabled={isArchive}
                data-testid={'button-select-item'}
                onClick={() => handleSelect(agent)}>
                <Box>
                    <div className='new-sidebar__especialista'>
                        <Box className='new-sidebar__especialista-icone'>
                            <span className={icon} />
                        </Box>
                        {labelAgente}
                    </div>
                </Box>
                <Box className='new-sidebar__icones' />
            </ListItemButton>
        )
    }

    return (
        <Paper>
            <Accordion
                expanded={expanded}
                onChange={() => !isDisabled && onChange()}
                disabled={isDisabled}
                className={isDisabled ? 'agent-accordion-disabled' : ''}>
                <Box className='new-sidebar__title-accordion'>
                    <AccordionSummary
                        className={`accordionSummary ${summaryClassName}`}
                        expandIcon={
                            expanded ? (
                                <ArrowDropUpIcon className='icone-agents' />
                            ) : (
                                <ArrowRightIcon className='icone-agents' />
                            )
                        }
                        aria-controls={summaryAriaControls}
                        id={summaryId}>
                        <p className={summaryClassNameTitle}>{summaryTitle}</p>
                    </AccordionSummary>
                </Box>
                <AccordionDetails>
                    <FixedSizeList
                        height={agents?.length ? Math.min(agents?.length * 50, 330) : 0}
                        className='new-sidebar__lista-agents'
                        width='100%'
                        itemSize={50}
                        itemCount={agents?.length ? agents?.length : 0}>
                        {renderRow}
                    </FixedSizeList>
                </AccordionDetails>
            </Accordion>
        </Paper>
    )
}

export default AgentAccordion
