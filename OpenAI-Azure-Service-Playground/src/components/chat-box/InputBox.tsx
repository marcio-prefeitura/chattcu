import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Box, Chip, Divider, IconButton, ListItem, ListItemIcon, Paper, Stack, TextField, Tooltip } from '@mui/material'
import { Close } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
// import InterpreterModeIcon from '@mui/icons-material/InterpreterMode'
// import StopIcon from '@mui/icons-material/Stop'
// import PhotoCamera from '@mui/icons-material/PhotoCamera'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'

import { IChat, IMessageHistory } from '../../infrastructure/utils/types'
import { isLocalhost } from '../../infrastructure/utils/util'
import { IFolder } from '../../shared/interfaces/Folder'
import { ISelectedFiles } from '../../shared/interfaces/SelectedFiles'
import { IUserInfo } from '../../hooks/useUserInfo'
import { sendStopChatProcess } from '../../infrastructure/api'
import { atualizaAgenteSelecionadoNoCache, getAgentByValue } from '../sidebar/history/AgentAccordion'
import CounterWords from '../counter-words/CounterWords'
import InputImage from '../image_usage/InputImage'
import If from '../operator/if'
import SelectAgent from '../select_agent/SelectAgent'
import SelectModelChat from '../select_model_chat/SelectModelChat'
import InputFiles from './InputFiles'
import ThumbnailImageInputBox from '../image_usage/ThumbnailImageInputBox'

export interface IInputBoxProps {
    filesSelected: ISelectedFiles[]
    setFilesSelected: any
    chat: IChat | null
    setChat: React.Dispatch<React.SetStateAction<IChat | null>>
    activeChat: IChat | null
    chatHandler: any
    textareaRef: React.RefObject<HTMLTextAreaElement>
    foldersRef: React.MutableRefObject<IFolder[]>
    submitChatMessage: (manualPrompt?: string, images?: string[]) => Promise<void>
    setTitleAlertModal: React.Dispatch<React.SetStateAction<string>>
    setMessageAlertModal: React.Dispatch<React.SetStateAction<string>>
    setOpenAlertModal: React.Dispatch<React.SetStateAction<boolean>>
    setUpdatedFoldersFromChipsActions: any
    profile: IUserInfo
    abortStream: any
    selectedAgent: AgentModel | undefined
    setSelectedAgent: (agent: AgentModel | undefined) => void
    isSharedChat?: boolean
    isModelLocked?: boolean
    setIsModelLocked: React.Dispatch<React.SetStateAction<boolean>>
    isChatLoading?: boolean
    getSelectedModelFromActiveChat?: () => string | undefined
    handleClikShowSidebar: () => void
    isOpenModalRealtime?: boolean | false
    handleModalRealtime?: (valor: boolean) => void
}

interface AgentModel {
    labelAgente: string
    valueAgente: string | undefined
    selected: boolean
    quebraGelo: string[]
    autor: string
    descricao: string
    icon: any
}

const InputBox: React.FC<IInputBoxProps> = ({
    activeChat,
    chatHandler,
    filesSelected,
    foldersRef,
    chat,
    setChat,
    setFilesSelected,
    setMessageAlertModal,
    setOpenAlertModal,
    setTitleAlertModal,
    submitChatMessage,
    textareaRef,
    setUpdatedFoldersFromChipsActions,
    profile,
    abortStream,
    selectedAgent,
    isSharedChat,
    isChatLoading,
    getSelectedModelFromActiveChat,
    setSelectedAgent,
    handleClikShowSidebar,
    isModelLocked,
    setIsModelLocked,
    isOpenModalRealtime,
    handleModalRealtime
}) => {
    const [contadorInput, setContadorInput] = useState(0)
    const [showClearButton, setShowClearButton] = useState(false)
    const [maxWords, setMaxWords] = useState(60000)

    const queryClient = useQueryClient()

    const pathname = useLocation()
    const router = useNavigate()

    const [showOptions, setShowOptions] = useState(false)
    const [mentionText, setMentionText] = useState('')

    const [imagesSelected, setImagesSelected] = useState<File[]>([])
    const [base64Images, setBase64Images] = useState<string[]>([])

    useEffect(() => {
        setChat(activeChat)
        chatHandler.set(activeChat!)
        handleChatStorage()
        if (isValidChat(activeChat)) {
            if (activeChat?.isStreamActive === undefined) {
                textareaRef.current!.value = ''
            }
            setContadorInput(chatHandler.getTokens())
            fileMessage(activeChat)
        } else {
            setContadorInput(0)
            setMaxWords(60000)
            setChat(null)
            setFilesSelected([])
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat, activeChat?.mensagens])

    const isValidChat = (chat: IChat | null): boolean => {
        return !!(chat && Object.keys(chat).length > 0)
    }

    const getFilesMessage = (message: IMessageHistory | undefined) => {
        const arquivos_selecionados_prontos: string[] | undefined = message?.arquivos_selecionados_prontos

        const filesSelected: ISelectedFiles[] = []

        arquivos_selecionados_prontos?.forEach(arquivo => {
            foldersRef.current?.forEach(folder => {
                const fileFound = folder.arquivos.find(file => file.id === arquivo)
                if (fileFound) {
                    filesSelected.push({
                        folder_name: folder.nome,
                        selected_files: [fileFound]
                    })
                }
            })
        })

        return filesSelected
    }

    const fileMessage = (activeChat: IChat | null) => {
        const message = lastMessage(activeChat)
        if (message) {
            const filesSelectedSeach = getFilesMessage(message)
            setFilesSelected(filesSelectedSeach)
        }
    }

    const lastMessage = (activeChat: IChat | null) => {
        return activeChat?.mensagens[activeChat?.mensagens.length - 1]
    }

    /* Essa função somente se o enter foi pressionado para enviar a mensagem */
    const handleSendMessage = event => {
        if (event.key !== 'Enter' || event.shiftKey) {
            return
        }
        if (canSendMessage()) {
            event.preventDefault()
            submitChatMessage(undefined, base64Images).then(() => {
                clearImages()
            })
        }
    }

    const clearImages = () => {
        setImagesSelected([])
        setBase64Images([])
    }

    const handleMessageByClick = () => {
        if (!verificaArquivosSelecionadosProntos()) {
            setTitleAlertModal('Aviso')
            setMessageAlertModal('Não foi possível enviar sua mensagem, um ou mais arquivos não estão prontos')
            setOpenAlertModal(true)
            return
        }

        submitChatMessage()
        clearImages()
    }

    const countPalavras = (textoDigitado: string) => {
        const palavras = textoDigitado.trim().split(/\s+/)
        return textoDigitado.trim().length > 0 ? palavras.length : 0
    }

    const filterOptions = () => {
        const cache: AgentModel[] | undefined = queryClient.getQueryData(['agents'])

        return cache?.filter(option => option.labelAgente.toLowerCase().startsWith(mentionText.toLowerCase()))
    }

    const filteredOptions = filterOptions()

    const handleChangePrompt = (text: string) => {
        const tokens: number = countPalavras(text)
        const contadorPalavras: number = chatHandler.getTokens() + tokens

        setContadorInput(contadorPalavras)

        if (contadorPalavras <= maxWords) {
            if (chat?.isLoading || chat?.isStreamActive) {
                if (text.endsWith('@')) {
                    text = text.slice(0, -1)
                }
            }
            setInputValue(text, false)
        }
        const lastIndex = text.lastIndexOf('@')
        if (lastIndex !== -1) {
            const afterAt = text.slice(lastIndex + 1)
            setMentionText(afterAt)
            setShowOptions(true)
        } else {
            setShowOptions(false)
        }
    }

    const handleSelect = async (agent: AgentModel) => {
        setShowOptions(false)
        await atualizaAgenteSelecionadoNoCache(queryClient, agent)
        setSelectedAgent(agent)
        const text = textareaRef.current?.value.split('@')
        if (text) {
            setInputValue(text[0], false)
        }
    }

    const handleDelete = () => async () => {
        const agentDefault = getAgentByValue(queryClient, null)
        await atualizaAgenteSelecionadoNoCache(queryClient, agentDefault)
        setSelectedAgent(agentDefault)
    }

    const handleChatStorage = () => {
        const chatStorage = localStorage.getItem('chat')
        if (chatStorage) {
            const message = JSON.parse(chatStorage)
            if (isPromptToChatLost(message) && !chat?.isLoading) {
                setInputValue(message.conteudo, false)
            }
        }
    }

    const isPromptToChatLost = (message: IMessageHistory) => {
        return (!activeChat && !message.chat_id) || (activeChat && activeChat.id === message.chat_id)
    }

    const openFileTab = () => (event: React.KeyboardEvent | React.MouseEvent) => {
        handleClikShowSidebar()
        if (
            event &&
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return
        }

        router(`${pathname.pathname}?tab=files`)
    }

    const handleModelChange = useCallback((newMaxWords: number) => {
        setMaxWords(prev => {
            if (prev !== newMaxWords) {
                return newMaxWords
            }
            return prev
        })
    }, [])

    const verificaArquivosSelecionadosProntos = () => {
        const data: ISelectedFiles[] = filesSelected
        for (const folder of data) {
            for (const file of folder.selected_files) {
                if (file.status !== 'PRONTO') {
                    return false
                }
            }
        }
        return true
    }

    const setInputValue = (text: string, trim: boolean) => {
        if (textareaRef.current) {
            textareaRef.current.value = trim ? text.trim() : text
        }
    }

    const canSendMessage = () => {
        return (
            (textareaRef.current?.value.trim() !== '' || base64Images.length > 0) &&
            !chatHandler.isStreaming() &&
            !chat?.isLoading &&
            contadorInput <= maxWords
        )
    }

    const hasSelectedFiles = filesSelected.find(fS => fS.selected_files.length > 0)

    const disabledButton =
        contadorInput >= maxWords || chat?.isLoading || chat?.isStreamActive || !textareaRef.current?.value

    const handleStopChatProcess = async () => {
        /**
         *  interage com endpoint de stopChatProcess somente em caso de ambientes com disponibilidade de instância do Redis
         *  remover em caso de testes com PUB/SUB com ambiente desenvolvimento local.
         */

        if (isLocalhost()) {
            abortStream()
        } else {
            const data = await sendStopChatProcess(activeChat?.correlacaoChamadaId)
            if (data?.status === 200) {
                abortStream()
            }
        }
    }

    const getTooltipMessage = () => {
        if (chat?.isLoading || chat?.isStreamActive) {
            return 'Não é possível remover o especialista enquanto o chat está respondendo'
        }
        if (filesSelected?.length > 0) {
            return 'Quando houver arquivo(s) selecionado(s) não será possível a seleção de um especialista'
        }
        return ''
    }

    const handleModalRealtimeLocal = () => {
        if (handleModalRealtime) handleModalRealtime(!isOpenModalRealtime)
    }

    const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files) {
            const validImages = Array.from(files).filter(file =>
                ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)
            )

            event.target.value = '' // Reset the input value

            setImagesSelected(validImages) // Update imagesSelected state with selected files
        }
    }

    const handleRemoveImage = (index: number) => {
        setBase64Images(prev => prev.filter((_, i) => i !== index))
        setImagesSelected(prev => prev.filter((_, i) => i !== index))

        if (imagesSelected.length === 1) {
            setImagesSelected([])
            setBase64Images([])
            clearImages()
        }
    }
    return (
        <Box className='chat-box__bloco-input'>
            <Box className='chat-box__bloco-input-agente'>
                {showOptions && filesSelected.length === 0 && (
                    <>
                        {filteredOptions?.map(agent => (
                            <ListItem
                                className='chat-box__bloco-input-agente-lista'
                                disablePadding
                                key={`input-box-${agent?.valueAgente}`}>
                                <ListItemButton
                                    selected={agent.selected}
                                    className='chat-box__bloco-input-agente-lista-item'
                                    onClick={() => handleSelect(agent)}
                                    divider={false}>
                                    <ListItemIcon className='chat-box__bloco-input-agente-lista-item-icone'>
                                        <span className={agent.icon} />
                                    </ListItemIcon>
                                    <ListItemText
                                        className='chat-box__bloco-input-agente-lista-item-nome'
                                        primary={agent.labelAgente}
                                    />
                                </ListItemButton>
                                <Divider className='menu-aling-box-divisor' />
                            </ListItem>
                        ))}
                    </>
                )}
            </Box>
            <Box className='chat-box__contador-especialista'>
                {/* versão NOVA */}
                <Paper
                    className='chat-box__especialista'
                    sx={{
                        display: 'flex',
                        justifyContent: 'initial',
                        paddingY: 1
                    }}>
                    <Tooltip title={getTooltipMessage()}>
                        <Box>
                            <Stack
                                direction='row'
                                alignItems='center'
                                spacing={0}>
                                <SelectAgent
                                    selectedAgent={selectedAgent}
                                    setSelectedAgent={setSelectedAgent}
                                    isDisabled={
                                        activeChat?.arquivado ||
                                        isSharedChat ||
                                        isChatLoading ||
                                        filesSelected?.length > 0 ||
                                        isModelLocked ||
                                        contadorInput >= maxWords
                                    }
                                />
                            </Stack>
                        </Box>
                    </Tooltip>
                </Paper>
                {/* versão PRODUÇÃO */}
                <If test={false}>
                    <If test={selectedAgent?.valueAgente}>
                        <Paper
                            className='chat-box__especialista'
                            sx={{
                                display: 'flex',
                                justifyContent: 'initial'
                            }}>
                            <Tooltip title={getTooltipMessage()}>
                                <span>
                                    {' '}
                                    <Chip
                                        className='chat-box__especialista-chip'
                                        color='default'
                                        onDelete={chat?.isLoading || chat?.isStreamActive ? () => {} : handleDelete()}
                                        deleteIcon={<Close />}
                                        avatar={<span className={selectedAgent?.icon} />}
                                        label={selectedAgent?.labelAgente}
                                        style={{
                                            opacity: chat?.isLoading || chat?.isStreamActive ? 0.7 : 1,
                                            pointerEvents: chat?.isLoading || chat?.isStreamActive ? 'none' : 'auto'
                                        }}
                                    />
                                </span>
                            </Tooltip>
                        </Paper>
                    </If>
                </If>
            </Box>
            <Box className='chat-box__message'>
                <TextField
                    inputRef={textareaRef}
                    fullWidth
                    id='fullWidth'
                    className='chat-box__custom-textfield'
                    placeholder='Pergunte algo ou faça uma requisição'
                    onKeyDown={event => handleSendMessage(event)}
                    onChange={e => handleChangePrompt(e.target.value)}
                    multiline
                    minRows={1}
                    maxRows={5}
                    disabled={contadorInput >= maxWords}
                    inputProps={{
                        'data-testid': 'chat-input'
                    }}
                    InputProps={{
                        startAdornment: (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                {profile.perfilDev && (
                                    <>
                                        <InputImage
                                            images={imagesSelected}
                                            onImagesConverted={setBase64Images}
                                        />
                                        {base64Images.length > 0 && (
                                            <ThumbnailImageInputBox
                                                images={base64Images}
                                                onRemoveImage={handleRemoveImage}
                                            />
                                        )}
                                    </>
                                )}
                                {hasSelectedFiles ? (
                                    <InputFiles
                                        filesSelected={filesSelected}
                                        setFilesSelected={setFilesSelected}
                                        foldersRef={foldersRef}
                                        showClearButton={showClearButton}
                                        setShowClearButton={setShowClearButton}
                                        setUpdatedFoldersFromChipsActions={setUpdatedFoldersFromChipsActions}
                                        profile={profile}
                                    />
                                ) : (
                                    <span aria-label='empty' />
                                )}
                                <Box className='teste-contador'>
                                    <CounterWords
                                        count={contadorInput}
                                        total={maxWords}
                                    />

                                    <Box className='chat-box__icones'>
                                        <Tooltip
                                            placement='top'
                                            title='Faça upload de arquivos para serem utilizados no chat'>
                                            <Box className='chat-box__icon-file'>
                                                <IconButton
                                                    onClick={openFileTab()}
                                                    disabled={contadorInput >= maxWords}
                                                    data-testid='icon-upload'>
                                                    <span className='icon-paper-clip' />
                                                </IconButton>
                                            </Box>
                                        </Tooltip>
                                        {profile.perfilDev && (
                                            <>
                                                <Tooltip
                                                    placement='top'
                                                    title='Upload images'>
                                                    <IconButton component='label'>
                                                        <span className='icon-image' />
                                                        <input
                                                            type='file'
                                                            accept='image/jpeg, image/png, image/gif'
                                                            multiple
                                                            hidden
                                                            onChange={handleImageSelection}
                                                        />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                        {!chat?.isLoading && !chat?.isStreamActive && (
                                            <>
                                                <If test={profile?.perfilDev}>
                                                    <IconButton
                                                        data-testid='botao-poc-realtime'
                                                        disabled={contadorInput >= maxWords}
                                                        onClick={handleModalRealtimeLocal}
                                                        className={contadorInput >= maxWords ? 'disabled-button' : ''}>
                                                        <span className='icon-mic' />
                                                    </IconButton>
                                                </If>
                                                <IconButton
                                                    disabled={disabledButton}
                                                    className='chat-box__botao-enviar'
                                                    data-testid='botao-enviar'
                                                    aria-label='send'
                                                    onClick={handleMessageByClick}>
                                                    <span
                                                        className={`SendMessenger ${
                                                            canSendMessage() ? 'active-icon' : ''
                                                        } icon-send`}
                                                    />
                                                </IconButton>
                                            </>
                                        )}
                                        {(chat?.isLoading || chat?.isStreamActive) && (
                                            <IconButton
                                                disabled={!activeChat?.correlacaoChamadaId}
                                                className='chat-box__message__botao-stop'
                                                data-testid='botao-stop'
                                                aria-label='stop'
                                                onClick={handleStopChatProcess}>
                                                <span className='icon-pause' />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Box>
                                <Box sx={{ width: '100%', mt: 1 }}>
                                    <SelectModelChat
                                        setSelectedAgent={setSelectedAgent}
                                        setIsModelLocked={setIsModelLocked}
                                        isArchive={activeChat?.arquivado || isSharedChat || isChatLoading}
                                        selectedModel={
                                            getSelectedModelFromActiveChat ? getSelectedModelFromActiveChat() : ''
                                        }
                                        onModelChange={handleModelChange}
                                        contadorInput={contadorInput}
                                    />
                                </Box>
                            </Box>
                        )
                    }}
                />
            </Box>
            <div className='chat-box__mensagem-atencao'>
                <b>Atenção:</b> O ChatTCU pode não ser preciso em todas as respostas. Verifique as informações.
            </div>
        </Box>
    )
}

export default InputBox
