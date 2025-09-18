import React from 'react'

import { Box, Button, Fade, IconButton, ListItem, ListItemIcon } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'

import { AgentModel } from '../../shared/interfaces/AgentModel'
import { atualizaAgenteSelecionadoNoCache, getAgentByValue } from '../sidebar/history/AgentAccordion'
import If from '../operator/if'

import './SelectAgent.scss'

interface SelectAgentProps {
    selectedAgent: AgentModel | undefined
    setSelectedAgent: any
    isDisabled: boolean | undefined
}

const SelectAgent: React.FC<SelectAgentProps> = props => {
    const { selectedAgent, setSelectedAgent, isDisabled } = props
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const queryClient = useQueryClient()
    const agentList: AgentModel[] | undefined = queryClient.getQueryData(['agents'])

    const isComponentDisabled = isDisabled || agentList?.length === 0

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (isComponentDisabled) return
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleSelect = (agent: AgentModel) => {
        if (isComponentDisabled) return
        atualizaAgenteSelecionadoNoCache(queryClient, agent)
        setAnchorEl(null)
        agent.selected = true
        setSelectedAgent(agent)
    }

    const handleSetAgentDefaultEvent = async (event: React.MouseEvent) => {
        event.stopPropagation()
        if (isComponentDisabled) return
        const agentDefault = getAgentByValue(queryClient, null)
        await atualizaAgenteSelecionadoNoCache(queryClient, agentDefault)
        setSelectedAgent(agentDefault)
    }

    return (
        <Box>
            <Box className='select-agent'>
                <Box
                    className={`select-agent__model-box ${isComponentDisabled ? 'disabled' : ''}`}
                    sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Button
                        id='fade-button'
                        className='select-agent__button'
                        data-testid={'button-menu-agent'}
                        aria-controls={open ? 'fade-menu' : undefined}
                        aria-haspopup='true'
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleClick}
                        disabled={isComponentDisabled}
                        endIcon={<ExpandMoreIcon />}
                        // sx={{
                        //     opacity: isComponentDisabled ? 0.5 : 1
                        // }}
                    >
                        <span className={selectedAgent?.icon} />
                        <span>{selectedAgent?.labelAgente}</span>
                    </Button>
                    <If test={selectedAgent?.labelAgente !== 'Seletor automático'}>
                        <IconButton
                            onClick={handleSetAgentDefaultEvent}
                            size='small'
                            className='select-agent__restore-agent'
                            disabled={isComponentDisabled}
                            // sx={{
                            //     opacity: isComponentDisabled ? 0.5 : 1,
                            //     '&.Mui-disabled': {
                            //         opacity: 0.5
                            //     },
                            //     '& .icon-x': {
                            //         opacity: isComponentDisabled ? 0.5 : 1
                            //     }
                            // }}
                        >
                            <span className='icon-x' />
                        </IconButton>
                    </If>
                </Box>
            </Box>
            <Box id='select-agent__menu'>
                <Menu
                    id='fade-menu'
                    anchorEl={anchorEl}
                    data-testid={'button-close-menu'}
                    open={open}
                    onClose={handleClose}
                    TransitionComponent={Fade}>
                    <nav aria-label='main mailbox folders'>
                        <List className='select-agent__list'>
                            {agentList?.map(agent => (
                                <ListItem
                                    disablePadding
                                    key={agent.labelAgente.replace(' ', '_')}
                                    data-testid='label-button-agent'>
                                    <ListItemButton
                                        selected={agent.selected}
                                        className='select-agent__list-item'
                                        data-testid={'button-select-agent'}
                                        onClick={() => handleSelect(agent)}>
                                        <ListItemIcon className='list-agent__list-item-icone'>
                                            <span className={agent.icon} />
                                        </ListItemIcon>
                                        <ListItemText
                                            className='list-agent__list-item-nome'
                                            primary={agent.labelAgente}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </nav>
                </Menu>
            </Box>
        </Box>
    )
}

export default SelectAgent
