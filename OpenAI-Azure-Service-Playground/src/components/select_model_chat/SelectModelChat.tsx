import React, { useCallback, useEffect } from 'react'

import { Box, Button, Fade, IconButton, ListItem, ListItemIcon } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'

import { AgentModel } from '../../shared/interfaces/AgentModel'
import { ModelChat } from '../../shared/interfaces/ModelChat'
import { listAllModels } from '../../infrastructure/api'
import { atualizaAgenteSelecionadoNoCache, getAgentByValue } from '../sidebar/history/AgentAccordion'
import If from '../operator/if'

import './SelectModelChat.scss'

interface SelectAgentProps {
    isArchive: boolean | undefined
    selectedModel: string | undefined
    setSelectedAgent: (agent: AgentModel | undefined) => void
    setIsModelLocked: React.Dispatch<React.SetStateAction<boolean>>
    onModelChange?: (maxWords: number) => void
    contadorInput?: number
}

const MODELO_PADRAO = 'GPT-4o'
const MODELO_PADRAO_ICON = 'icon-gpt'

const SelectModelChat: React.FC<SelectAgentProps> = props => {
    const { isArchive, selectedModel, setSelectedAgent, setIsModelLocked, onModelChange } = props
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const [modeloSelecionado, setModeloSelecionado] = React.useState<string>(MODELO_PADRAO)
    const [iconeModeloSelecionado, setIconeModeloSelecionado] = React.useState<any>(
        <span className={MODELO_PADRAO_ICON} />
    )

    const open = Boolean(anchorEl)
    const queryClient = useQueryClient()

    const transformData = useCallback(
        (data: any) => {
            if (!data?.modelos) return []

            return data.modelos.map((model: ModelChat) => {
                model.selected =
                    model.name.toLowerCase() === (selectedModel?.toLowerCase() ?? MODELO_PADRAO.toLowerCase())
                return model
            })
        },
        [selectedModel]
    )

    useQuery(['modelChats'], listAllModels, {
        onSuccess: data => {
            const transformedData = transformData(data)
            queryClient.setQueryData(['modelChats'], transformedData)
            const selected: ModelChat = transformedData.find((model: ModelChat) => model.selected)
            setModeloSelecionado(selected?.name ?? MODELO_PADRAO)
            setIconeModeloSelecionado(selected?.icon ?? MODELO_PADRAO_ICON)
        },
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false
    })

    useEffect(() => {
        const cachedData = queryClient.getQueryData<ModelChat[]>(['modelChats'])
        let selected = selectedModel
        let selectedIcon = MODELO_PADRAO_ICON

        if (selectedModel && cachedData) {
            const updatedModels = cachedData.map(model => {
                const sel = model.name?.toLowerCase() === selectedModel.toLowerCase()
                model.selected = sel

                if (sel) {
                    selected = model.name
                    selectedIcon = model.icon

                    const maxWords = model.name.includes('Claude 3.5 Sonnet') ? 95000 : 60000
                    if (onModelChange) {
                        onModelChange(maxWords)
                    }

                    model.max_words = maxWords
                }

                return model
            })

            queryClient.setQueryData(['modelChats'], updatedModels)
            setModeloSelecionado(selected ?? MODELO_PADRAO)
            setIconeModeloSelecionado(selectedIcon ?? MODELO_PADRAO_ICON)
        }
    }, [selectedModel, queryClient, onModelChange])

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (isComponentDisabled) return
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleSelect = (model: ModelChat) => {
        if (isComponentDisabled) return
        const cachedData = queryClient.getQueryData<ModelChat[]>(['modelChats'])

        const maxWords = model.name.includes('Claude 3.5 Sonnet') ? 95000 : 60000

        const newModels = cachedData?.map(m => ({
            ...m,
            selected: m.name === model.name,
            max_words: m.name === model.name ? maxWords : m.max_words
        }))

        queryClient.setQueryData(['modelChats'], newModels)

        setModeloSelecionado(model.name ?? '')
        setIconeModeloSelecionado(model.icon ?? MODELO_PADRAO_ICON)

        if (props.onModelChange) {
            props.onModelChange(maxWords)
        }

        if (model.name.startsWith('o1')) {
            const agentDefault = getAgentByValue(queryClient, 'CONHECIMENTOGERAL')
            setSelectedAgent(agentDefault)
            setIsModelLocked(true)

            atualizaAgenteSelecionadoNoCache(queryClient, agentDefault)
        } else {
            const defaultAgent = getAgentByValue(queryClient, null)
            setIsModelLocked(false)
            atualizaAgenteSelecionadoNoCache(queryClient, defaultAgent)
        }

        setAnchorEl(null)
    }

    let listModelChats = queryClient.getQueryData<ModelChat[]>(['modelChats'])
    if (listModelChats && !listModelChats[0]?.name) {
        listModelChats = transformData(listModelChats)
    }

    const isComponentDisabled = isArchive || listModelChats?.length === 0

    const getDisabledStyle = {
        pointerEvents: isComponentDisabled ? 'none' : 'auto',
        opacity: isComponentDisabled ? 0.5 : 1,
        cursor: isComponentDisabled ? 'not-allowed' : 'pointer'
    }

    const isModelDisabled = (model: ModelChat) => {
        const contadorInput = props.contadorInput ?? 0
        const isClaude = model.name?.includes('Claude 3.5 Sonnet')

        if (contadorInput >= 95000) {
            return true
        }

        if (contadorInput >= 60000) {
            return !isClaude
        }

        return false
    }

    return (
        <Box>
            <Box className='select-model'>
                <Box className='select-model__model-box'>
                    <Box
                        component='span'
                        sx={getDisabledStyle}>
                        <IconButton
                            onClick={handleClose}
                            size='small'
                            disabled={isComponentDisabled}>
                            <span className={iconeModeloSelecionado} />
                        </IconButton>
                    </Box>
                    <Button
                        id='fade-button'
                        className='select-agent__button-model'
                        data-testid={'button-menu-model'}
                        aria-controls={open ? 'fade-menu' : undefined}
                        aria-haspopup='true'
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleClick}
                        disabled={isComponentDisabled}
                        endIcon={<ExpandMoreIcon />}>
                        <span>{modeloSelecionado}</span>
                    </Button>
                </Box>
            </Box>
            <Box id='select-agent__menu'>
                <Menu
                    id='fade-menu'
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    TransitionComponent={Fade}>
                    <nav aria-label='main mailbox folders'>
                        <List className='select-agent__list'>
                            {listModelChats?.map(model => (
                                <ListItem
                                    disablePadding
                                    key={model.name}
                                    data-testid={`label-button-${model.name}`}>
                                    <ListItemButton
                                        selected={model.selected}
                                        className='select-agent__list-item'
                                        disabled={isModelDisabled(model)}
                                        onClick={() => handleSelect(model)}>
                                        <ListItemIcon className='list-agent__list-item-icone'>
                                            <span className={model.icon} />
                                        </ListItemIcon>
                                        <Box className='list-agent__list-box-descricao'>
                                            <Box className='list-agent__list-box-beta'>
                                                <ListItemText
                                                    className='list-agent__list-item-nome'
                                                    primary={model.name}
                                                />
                                                <If test={model.is_beta}>
                                                    <span className='list-agent__list-beta'>beta</span>
                                                </If>
                                            </Box>
                                            <span className='list-agent__list-descricao'>{model.description}</span>
                                        </Box>
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

export default SelectModelChat
