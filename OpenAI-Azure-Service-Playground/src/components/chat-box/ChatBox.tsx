import {
    atualizaAgenteSelecionadoNoCache,
    getAgentByValue,
    getAgenteSelecionadoDoCache
} from '../sidebar/history/AgentAccordion'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { AlertColor, Box, Button, Fab, Toolbar } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

import { sendMsgToStream } from '../../infrastructure/api/fetch'
import { IChat, IMessageHistory, IStreamResponse, IStreamResponseError } from '../../infrastructure/utils/types'
import { AgentModel } from '../../shared/interfaces/AgentModel'
import { IFolder } from '../../shared/interfaces/Folder'
import { ModelChat } from '../../shared/interfaces/ModelChat'
import { ISelectedFiles } from '../../shared/interfaces/SelectedFiles'
import { removeQuotes, setInitialTitle } from '../../shared/utils/Chat'
import { InTeamsContext } from '../../context/AppContext'
import useChat from '../../hooks/useChat'
import { useFolder } from '../../hooks/useFolder'
import { useUpload } from '../../hooks/useUpload'
import { IUserInfo } from '../../hooks/useUserInfo'
import { AlertModal } from '../alert-modal/AlertModal'
import MessageToast from '../message-toast/MessageToast'
import If from '../operator/if'
import ModalRealtime from '../realtime-audio/ModalRealtime'
import { setError } from './error/errorHandler'
import InputBox from './InputBox'
import MessageBox from './MessageBox'
import { clearPartialData, parseStreamData } from './stream-utils'

import './ChatBox.scss'

export interface ChatBoxProps {
    profile: IUserInfo
    activeChat: IChat | null
    setActiveChat: any
    onInitNewChat: (newChat: IChat) => void
    updateChatStream: (updatedChat: IChat) => void
    setUpdatedFoldersFromChipsActions: any
    filesSelected: ISelectedFiles[]
    setFilesSelected: any
    onUnArchiveChat: (chat: IChat | null) => void
    onAlert: (severity: AlertColor | undefined, MessageToast: string, duration?: number) => void
    setSelectedAgent: (agent: AgentModel | undefined) => void
    selectedAgent: AgentModel | undefined
    isSharedChat: boolean
    shareId: string | null | undefined
    onGoToOriginalChat: (chat: IChat | null) => void
    onContinueConversation: (shareId: string | null | undefined) => void
    handleStartShareChat: (chat: IChat) => void
    handleClikShowSidebar: () => void
    isModelLocked: boolean
    setIsModelLocked: React.Dispatch<React.SetStateAction<boolean>>
}

const ChatBox: React.FC<ChatBoxProps> = ({
    profile,
    activeChat,
    setActiveChat,
    onInitNewChat,
    updateChatStream,
    setUpdatedFoldersFromChipsActions,
    filesSelected,
    setFilesSelected,
    onUnArchiveChat,
    setSelectedAgent,
    onAlert,
    selectedAgent,
    isSharedChat,
    isModelLocked,
    setIsModelLocked,
    shareId,
    onGoToOriginalChat,
    onContinueConversation,
    handleStartShareChat,
    handleClikShowSidebar
}) => {
    const [buttonNone, setButtonNone] = useState<boolean>(true)
    const [isShowSnack, setIsShowSnack] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [openAlertModal, setOpenAlertModal] = useState<boolean>(false)
    const [openShareModal, setOpenShareModal] = useState<boolean>(false)
    const [titleAlertModal, setTitleAlertModal] = useState<string>('')
    const [messageAlertModal, setMessageAlertModal] = useState<string>('')
    const isChatLoading = activeChat?.isLoading || activeChat?.isStreamActive
    const [openModalRealtime, setOpenModalRealtime] = useState<boolean>(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const scrollArea = useRef<HTMLDivElement>(null)

    const inTeams = useContext(InTeamsContext)

    const queryClient = useQueryClient()

    const chatHandler = useChat()
    const { getSelectedFileIds, getReadyFileIds } = useFolder()

    const foldersRef = useRef<IFolder[]>([])

    let hasScrolledUpOnce = false

    const { uploadedFiles } = useUpload()
    const [controller, setController] = useState<AbortController | null>(null)

    foldersRef.current = uploadedFiles

    useEffect(() => {
        if (activeChat && activeChat.mensagens.length > 0) {
            const msg = activeChat.mensagens
            const especialista = msg[msg.length - 1]['especialista_utilizado']
                ? msg[msg.length - 1]['especialista_utilizado']
                : null
            const agent = especialista
                ? getAgentByValue(queryClient, especialista)
                : getAgentByValue(queryClient, activeChat.especialista_utilizado)
            atualizaAgenteSelecionadoNoCache(queryClient, agent)
            setSelectedAgent(agent)
        }
        setActiveChat(activeChat)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat, setActiveChat])

    useEffect(() => {
        if (textareaRef.current) {
            focusInput()
        }
    }, [])

    useEffect(() => {
        setTimeout(() => {
            if (scrollArea.current?.scrollTo) {
                scrollArea.current.scrollTo(0, scrollArea.current.scrollHeight)
            }
        }, 0)
    }, [activeChat?.mensagens.length])

    useEffect(() => {
        const scrollableElement = scrollArea.current
        if (scrollableElement) {
            scrollableElement.addEventListener('scroll', handleScroll)
            return () => {
                scrollableElement.removeEventListener('scroll', handleScroll)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat])

    const handleScroll = useCallback(() => {
        if (scrollArea.current && activeChat) {
            const scrollableElement = scrollArea.current

            // Check if there's an open citation
            const hasCitationOpen = document.querySelector('.toggled')

            if (!hasCitationOpen) {
                // Check if we're at the bottom of the scroll
                const isAtBottom =
                    Math.abs(
                        scrollableElement.scrollHeight - scrollableElement.scrollTop - scrollableElement.clientHeight
                    ) < 1

                // Update the button visibility only when the scroll position has actually changed
                setButtonNone(isAtBottom)
            }
        }
    }, [activeChat])

    const shouldScrollToBottom = () => {
        if (scrollArea.current) {
            const scrollElement = scrollArea.current
            const isNearBottom =
                scrollElement.scrollHeight - scrollElement.scrollTop <= scrollElement.clientHeight + 100

            if (isNearBottom || !hasScrolledUpOnce) {
                scrollElement.scrollTo(0, scrollElement.scrollHeight)
                hasScrolledUpOnce = false
            }
        }
    }

    const getSelectedModel = useCallback(async () => {
        const modelList: ModelChat[] | undefined = await queryClient.getQueryData(['modelChats'])
        return modelList?.find(model => model.selected)
    }, [queryClient])

    const submitChatMessage = async (manualPrompt?: string, base64Images?: string[]) => {
        let updatedChat: IChat
        let newMessageData: IMessageHistory[] = []
        const token = uuidv4()
        const arquivosSelecionados = getSelectedFiles(filesSelected)
        const arquivosSelecionadosProntos = getSelectedFilesStatusPronto(filesSelected)
        const modelSelected = await getSelectedModel()
        const selectedAgent = getAgenteSelecionadoDoCache(queryClient)

        if (arquivosSelecionados.length > 0 || arquivosSelecionadosProntos.length > 0) {
            await atualizaAgenteSelecionadoNoCache(queryClient, getAgentByValue(queryClient, null))
        }

        const now = new Date()
        const correlacaoChamadaId = uuidv4()
        const newMessage: IMessageHistory = {
            chat_id: activeChat?.id ?? '',
            temp_chat_id: token,
            codigo: '',
            conteudo: removeQuotes(manualPrompt) ?? textareaRef.current!.value.trim(),
            papel: 'USER',
            data_envio: now,
            arquivos_selecionados: arquivosSelecionados,
            arquivos_selecionados_prontos: arquivosSelecionadosProntos,
            tool_selecionada: selectedAgent?.valueAgente,
            parametro_modelo_llm: modelSelected?.name,
            correlacao_chamada_id: correlacaoChamadaId,
            imagens: base64Images,
            config: selectedAgent
        }
        localStorage.setItem('chat', JSON.stringify({ ...newMessage }))
        newMessageData = activeChat ? [...activeChat.mensagens, newMessage] : [newMessage]

        if (!activeChat) {
            updatedChat = {
                id: '',
                temp_chat_id: token,
                mensagens: newMessageData,
                data_ultima_iteracao: now,
                isStreamActive: false,
                isLoading: true,
                titulo: setInitialTitle(newMessage.conteudo),
                especialista_utilizado: selectedAgent?.valueAgente,
                modelo_selecionado: modelSelected?.name,
                correlacaoChamadaId: correlacaoChamadaId
            }
            onInitNewChat(updatedChat)
        } else {
            updatedChat = {
                ...activeChat,
                isLoading: true,
                data_ultima_iteracao: now,
                isStreamActive: false,
                mensagens: newMessageData,
                especialista_utilizado: selectedAgent?.valueAgente,
                modelo_selecionado: modelSelected?.name,
                correlacaoChamadaId: correlacaoChamadaId
            }
        }

        setActiveChat(updatedChat)
        if (textareaRef.current) {
            textareaRef.current.value = ''
            textareaRef.current.value.trimStart()
            textareaRef.current.value.trimEnd()
        }
        handleStream(updatedChat, newMessage)
    }

    const handleArrow = useCallback(() => {
        if (scrollArea.current) {
            scrollArea.current.scrollTo({
                top: scrollArea.current.scrollHeight,
                behavior: 'smooth'
            })
            // Aguarde o scroll terminar antes de verificar a posição
            setTimeout(() => {
                handleScroll()
            }, 100)
        }
    }, [handleScroll])

    const handleRemoveChatStorage = () => {
        localStorage.removeItem('chat')
    }

    const updateChatWithStreamResponse = (r: IStreamResponse, updatedChat: IChat, lastMessageIndex: number) => {
        updatedChat.id = r.chat_id
        updatedChat.mensagens[lastMessageIndex].isStreamActive = true
        updatedChat.mensagens[lastMessageIndex].conteudo += r.response
        updatedChat.mensagens[lastMessageIndex].trechos = r.trechos
        updatedChat.mensagens[lastMessageIndex].arquivos_busca = r.arquivos_busca
        updatedChat.titulo = r.chat_titulo !== '' ? r.chat_titulo : updatedChat.titulo
        updatedChat.mensagens[lastMessageIndex].chat_id = r.chat_id
        updatedChat.mensagens[lastMessageIndex].codigo = r.codigo_response
        updatedChat.mensagens[lastMessageIndex - 1].codigo = r.codigo_prompt
        updatedChat.isLoading = false
        updatedChat.isStreamActive = true
        updatedChat.arquivos_busca = r.arquivos_busca
    }

    const handleErrorResponse = (response: Response, updatedChat: IChat, lastMessageIndex: number) => {
        updatedChat.mensagens.splice(lastMessageIndex - 1, 2)
        updateChatStream({ ...updatedChat, isLoading: false, isStreamActive: false })
        setIsShowSnack(true)
        const error = setError(response)
        setErrorMsg(error.statusText)

        if (error.status === 401) {
            setTimeout(() => window.location.reload(), 3000)
        }
    }

    const processStreamResponse = (
        response: IStreamResponse | IStreamResponseError,
        updatedChat: IChat,
        lastMessageIndex: number
    ) => {
        if ('status' in response && 'message' in response) {
            onAlert('error', response.message)
            updatedChat.mensagens.splice(lastMessageIndex - 1, 2)
            return
        }

        updateChatWithStreamResponse(response, updatedChat, lastMessageIndex)
        chatHandler.set(updatedChat)
        updateChatStream(updatedChat)
        handleRemoveChatStorage()
        shouldScrollToBottom()
    }

    const handleStream = async (updatedChat: IChat, newMessage: IMessageHistory) => {
        const newAssistentMessage: IMessageHistory = {
            chat_id: '',
            codigo: '',
            conteudo: '',
            papel: 'ASSISTANT',
            data_envio: new Date(),
            codigo_prompt: '',
            isStreamActive: false,
            arquivos_selecionados: newMessage.arquivos_selecionados,
            arquivos_selecionados_prontos: newMessage.arquivos_selecionados_prontos,
            parametro_modelo_llm: updatedChat.modelo_selecionado
        }

        updatedChat.mensagens.push(newAssistentMessage)
        const controller = new AbortController()
        setController(controller)
        const lastMessageIndex = updatedChat.mensagens.length - 1

        try {
            const response = await sendMsgToStream(newMessage, controller.signal)

            if (!response?.body || response.status !== 200) {
                handleErrorResponse(response, updatedChat, lastMessageIndex)
                return
            }

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
            let result = await reader.read()

            while (!result.done) {
                const streamResponses = parseStreamData(result.value, updatedChat)

                for (const response of streamResponses) {
                    processStreamResponse(response, updatedChat, lastMessageIndex)
                }

                result = await reader.read()
            }

            if (updatedChat.mensagens?.length > 0) {
                updatedChat.mensagens[lastMessageIndex].isStreamActive = false
            }

            updateChatStream({ ...updatedChat, isLoading: false, isStreamActive: false })
            focusInput()
            shouldScrollToBottom()
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted')
                clearPartialData()
            } else {
                console.error('Fetch error:', error)
            }
        }
    }

    const handleStopChat = () => {
        if (controller) {
            try {
                if (activeChat?.isLoading) {
                    activeChat.isLoading = false
                }
                controller.abort()
                setController(new AbortController())
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (error.name === 'AbortError') {
                    console.log('Fetch aborted')
                } else {
                    console.error('Fetch error:', error)
                }
            }
        }
    }

    const getSelectedFiles = (selectedFiles: ISelectedFiles[] = []): string[] => {
        return getSelectedFileIds(selectedFiles)
    }

    const getSelectedFilesStatusPronto = (selectedFiles: ISelectedFiles[] = []): string[] => {
        return getReadyFileIds(selectedFiles)
    }

    const focusInput = () => {
        setTimeout(() => {
            if (textareaRef.current) textareaRef.current.focus()
        }, 1000)
    }

    const onClickContinuar = (status: boolean) => {
        setOpenShareModal(false)

        if (!status) {
            return
        }

        onContinueConversation(shareId)
    }

    const isChatOwner = activeChat?.usuario?.toLowerCase() === profile?.login.split('@')[0].toLowerCase()

    const getSelectedModelFromActiveChat = useCallback(() => {
        if (activeChat && activeChat.mensagens.length > 0) {
            return activeChat.mensagens[activeChat.mensagens.length - 1].parametro_modelo_llm
        }

        return undefined
    }, [activeChat])

    useEffect(() => {
        if (activeChat) {
            setTimeout(() => {
                if (scrollArea.current?.scrollTo) {
                    scrollArea.current.scrollTo({
                        top: scrollArea.current.scrollHeight,
                        behavior: 'auto'
                    })
                    handleScroll()
                }
            }, 0)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChat])

    useEffect(() => {
        const scrollableElement = scrollArea.current
        if (scrollableElement) {
            scrollableElement.addEventListener('scroll', handleScroll)
            return () => {
                scrollableElement.removeEventListener('scroll', handleScroll)
            }
        }
    }, [handleScroll])
    return (
        <>
            <Box>
                <Toolbar />
                <Box className={`chat-box ${inTeams ? 'chat-box__teams' : ''}`}>
                    <Box className='chat-box__selects-box'>
                        <Box className='chat-box__selects'>
                            <If
                                test={
                                    activeChat && // Verifica se existe um chat ativo
                                    activeChat.mensagens && // Verifica se existe mensagens
                                    activeChat.mensagens.length > 0 && // Verifica se tem mensagens
                                    !activeChat?.isLoading && // Não está carregando
                                    !activeChat?.isStreamActive && // Não está respondendo
                                    !activeChat?.arquivado && // Chat não arquivado
                                    !isSharedChat // Não é chat compartilhado
                                }>
                                <Button
                                    onClick={() => handleStartShareChat(activeChat!)}
                                    className='chat-box__button-select-style'>
                                    <span className='icon-share' />
                                    Compartilhar
                                </Button>
                            </If>
                        </Box>
                    </Box>
                    <MessageBox
                        chat={activeChat}
                        setChat={setActiveChat}
                        isSharedChat={isSharedChat}
                        profile={profile}
                        scrollArea={scrollArea}
                        submitChatMessage={submitChatMessage}
                        stopTyping={handleStopChat}
                        shouldScrollToBottom={shouldScrollToBottom}
                    />

                    {activeChat && (
                        <Fab
                            onClick={handleArrow}
                            className={`chat-box__botao-rolagem ${buttonNone ? 'oculto' : ''}`}
                            style={{ display: buttonNone ? 'none' : 'flex' }}
                            size='small'
                            aria-label='add'>
                            <KeyboardArrowDownRoundedIcon />
                        </Fab>
                    )}
                    <Box className={`chat-box__divisor ${buttonNone ? 'oculto' : ''}`} />
                    <If test={!activeChat?.arquivado && !isSharedChat}>
                        <InputBox
                            activeChat={activeChat}
                            chat={activeChat}
                            chatHandler={chatHandler}
                            filesSelected={filesSelected}
                            foldersRef={foldersRef}
                            setChat={setActiveChat}
                            setFilesSelected={setFilesSelected}
                            setMessageAlertModal={setMessageAlertModal}
                            setOpenAlertModal={setOpenAlertModal}
                            setTitleAlertModal={setTitleAlertModal}
                            setUpdatedFoldersFromChipsActions={setUpdatedFoldersFromChipsActions}
                            submitChatMessage={submitChatMessage}
                            textareaRef={textareaRef}
                            profile={profile}
                            abortStream={handleStopChat}
                            selectedAgent={selectedAgent}
                            setSelectedAgent={setSelectedAgent}
                            isSharedChat={isSharedChat}
                            isChatLoading={isChatLoading}
                            isModelLocked={isModelLocked}
                            setIsModelLocked={setIsModelLocked}
                            getSelectedModelFromActiveChat={getSelectedModelFromActiveChat}
                            handleClikShowSidebar={handleClikShowSidebar}
                            isOpenModalRealtime={openModalRealtime}
                            handleModalRealtime={setOpenModalRealtime}
                        />
                    </If>
                    <If test={activeChat?.arquivado && !isSharedChat}>
                        <Box
                            key={`button_${activeChat?.id}`}
                            className={'chat-box__botao-desarquivar'}>
                            <Box className='chat-box__mensagem-atencao'>
                                Esta converssa foi arquivada. Para continuar, desarquive-a primeiro.
                            </Box>
                            <Button
                                className='chat-box__botao-desarquivar-button'
                                variant='contained'
                                onClick={() => {
                                    onUnArchiveChat(activeChat)
                                }}
                                color='primary'
                                startIcon={<span className='icon-unarchive' />}>
                                Desarquivar
                            </Button>
                        </Box>
                    </If>

                    {isSharedChat && activeChat && (
                        <Box className='chat-box__shared-actions'>
                            <Box className='chat-box__mensagem-atencao'>Esta chat foi compartilhado.</Box>

                            <Button
                                variant='contained'
                                className='chat-box__shared-actions__botao-ir-para-o-chat'
                                onClick={() =>
                                    isChatOwner ? onGoToOriginalChat(activeChat) : setOpenShareModal(true)
                                }>
                                {isChatOwner ? 'Ver chat original' : 'Continuar chat'}
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
            <MessageToast
                severity='warning'
                show={isShowSnack}
                msg={errorMsg}
                onClose={() => setIsShowSnack(false)}
            />
            <AlertModal
                message={messageAlertModal}
                messageOk={'Ok'}
                title={titleAlertModal}
                openModal={openAlertModal}
                showCancelButton={false}
                onConfirmation={() => setOpenAlertModal(false)}
            />
            <AlertModal
                message={`Deseja Continuar este chat "${setInitialTitle(
                    activeChat?.titulo ?? ''
                )}..." que foi compartilhada com você?`}
                messageOk={'Confirmar'}
                title={titleAlertModal}
                openModal={openShareModal}
                showCancelButton={true}
                onConfirmation={onClickContinuar}
            />
            <ModalRealtime
                titulo='POC - Assistente Virtual Realtime Áudio TCU, Tela Experimental.'
                descricao=''
                handleOpenModal={setOpenModalRealtime}
                openModal={openModalRealtime}
            />
        </>
    )
}

export default ChatBox
