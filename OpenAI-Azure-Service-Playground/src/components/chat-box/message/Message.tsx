import './Message.scss'
import React, { RefObject, useState } from 'react'
import { Box } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import { v4 } from 'uuid'
import { ReactComponent as Robo } from '../../../assets/logo.svg'
import { IChat, IFeedback, IMessageHistory } from '../../../infrastructure/utils/types'
import TooltipModal from '../../tooltip-modal/TooltipModal'
import Actions from './actions/Actions'
import TooltipModalFile from '../../tooltip-modal-file/TooltipModalFile'
import FilesNotOk from './panel-files-not-ok/FilesNotOk'
import { IUserInfo } from '../../../hooks/useUserInfo'
import MessageHeader from './MessageHeader'
import MessageContent from './MessageContent'
import If from '../../operator/if'
import FeedbackDialog from '../../feedback-dialog/FeedbackDialog'
import MessageToast from '../../message-toast/MessageToast'
import ThumbnailImageMessage from '../../image_usage/ThumbnailImageMessage'

interface MessageProps {
    profile: IUserInfo
    message: IMessageHistory
    isSharedChat: boolean
    isLastMessage?: boolean
    stopTyping: any
    shouldScrollToBottom: any
    activeChat: IChat | null
    setActiveChat: any
    scrollArea: RefObject<HTMLDivElement>
}

export const getIgnoredFiles = (message: IMessageHistory) => {
    if (message.arquivos_selecionados && message.arquivos_selecionados.length > 0) {
        const ids_arquivos_ignorados = message.arquivos_selecionados.filter(
            arq => !message.arquivos_selecionados_prontos?.includes(arq)
        )

        if (ids_arquivos_ignorados && ids_arquivos_ignorados.length > 0) return ids_arquivos_ignorados

        return false
    }

    return false
}

const Message: React.FC<MessageProps> = ({ profile, message, isSharedChat, activeChat, setActiveChat, scrollArea }) => {
    const { codigo, conteudo, papel, feedback } = message
    const [isOpenModalTrecho, setIsOpenModalTrecho] = useState<boolean>(false)
    const [isOpenModalTrechoArquivo, setIsOpenModalTrechoArquivo] = useState<boolean>(false)
    const [trechoSelecionado, setTrechoSelecionado] = useState<any[]>([])
    const [isOpenFeedbackDialog, setIsOpenFeedbackDialog] = useState<boolean>(false)
    const [codiMessageFeedback, setCodiMessageFeedback] = useState<string>('')
    const [reacao, setReacao] = useState<'LIKED' | 'DISLIKED' | undefined>()
    const [isShowSucessSnack, setIsShowSucessSnack] = useState(false)
    const [isShowErrorSnack, setIsShowErrorSnack] = useState(false)
    const [previousScrollPosition, setPreviousScrollPosition] = useState(0)

    const arrayFileSeach = message.arquivos_busca?.split(',')

    const openModalTooltip = (trecho: any | undefined) => {
        if (message.arquivos_busca !== 'Arquivos') {
            setIsOpenModalTrecho(true)
            setTrechoSelecionado(trecho)
        } else {
            setIsOpenModalTrechoArquivo(true)
            setTrechoSelecionado(trecho)
        }
    }

    const handleSendFeedback = (feedback: IFeedback) => {
        if (activeChat?.id === feedback.chat_id) {
            const mensagensUpdated: IMessageHistory[] = activeChat?.mensagens.map(msg => {
                if (msg.codigo === feedback.cod_mensagem) {
                    return { ...msg, feedback: feedback }
                }

                return msg
            })

            setActiveChat(prev => {
                if (prev) prev.mensagens = mensagensUpdated
                return prev
            })
        }
    }

    const isNearBottom = (): boolean => {
        if (!scrollArea.current) return false
        const { scrollHeight, scrollTop, clientHeight } = scrollArea.current
        return scrollHeight - scrollTop <= clientHeight + 200
    }

    const scrollToPosition = (position: number) => {
        if (scrollArea.current) {
            scrollArea.current.scrollTo({
                top: position,
                behavior: 'smooth'
            })
        }
    }

    const handleOpenFeedbackDialog = (cod_message: string, reacao: 'LIKED' | 'DISLIKED' | undefined) => {
        if (cod_message && reacao) {
            setPreviousScrollPosition(scrollArea.current?.scrollTop ?? 0)

            setCodiMessageFeedback(cod_message)
            setReacao(reacao)
            setIsOpenFeedbackDialog(true)

            if (scrollArea.current) {
                const newScrollPosition = isNearBottom()
                    ? scrollArea.current.scrollHeight + 200
                    : scrollArea.current.scrollTop + 150

                setTimeout(() => {
                    scrollToPosition(newScrollPosition)
                }, 100)
            }
        }
    }

    const handleCloseFeedbackDialog = () => {
        scrollToPosition(previousScrollPosition)
        setIsOpenFeedbackDialog(false)
        setCodiMessageFeedback('')
    }

    const uuid = v4()
    getIgnoredFiles(message)

    return (
        <>
            <div
                key={codigo}
                className='message'>
                {papel === 'USER' && (
                    <div
                        key={`box-msg-${codigo}-and-avatar-${uuid}`}
                        className='message__item-prompt'>
                        <Box
                            key={`box-avatar-msg-${codigo}-${uuid}`}
                            className='message__box-avatar-user-question'>
                            <If test={!isSharedChat}>
                                <Avatar key={`avatar-msg-${codigo}-${uuid}`}>{profile.initialLetters}</Avatar>
                            </If>
                            <MessageContent
                                key={`msg-box-content-${message.codigo}`}
                                message={message}
                                openModalTooltip={openModalTooltip}
                                isSharedChat={isSharedChat}
                                profile={profile}
                            />
                        </Box>
                        {message.imagens && message.imagens.length > 0 && (
                            <ThumbnailImageMessage images={message.imagens} />
                        )}
                    </div>
                )}
                {papel === 'ASSISTANT' && (
                    <div
                        key={`box-msg-${codigo}-and-tooltips-${uuid}`}
                        className='message'>
                        <TooltipModal
                            key={`tooltipmodal-msg-${codigo}-${uuid}`}
                            openModalTrecho={isOpenModalTrecho}
                            trecho={trechoSelecionado}
                            handleOpenModal={setIsOpenModalTrecho}
                        />
                        <TooltipModalFile
                            key={`tooltipmodalfile-msg-${codigo}-${uuid}`}
                            openModalTrecho={isOpenModalTrechoArquivo}
                            trecho={trechoSelecionado}
                            handleOpenModal={setIsOpenModalTrechoArquivo}
                        />

                        <Box className='message__box-paragrafo'>
                            <Avatar
                                key={`msg-box-avatar-${message.codigo}`}
                                className='message__avatar-chattcu'>
                                <Robo />
                            </Avatar>
                            <Box className='message__box-base-paragrafo'>
                                <MessageHeader
                                    key={`msg-box-header-${message.codigo}`}
                                    arrayFileSeach={arrayFileSeach}
                                    codigo={codigo}
                                    modelo_utilizado={message.parametro_modelo_llm}
                                />
                                <FilesNotOk
                                    key={`msg-box-file-not-ok-${message.codigo}`}
                                    message={message}
                                    ids_arquivos_ignorados={getIgnoredFiles(message)}
                                />
                                <MessageContent
                                    key={`msg-box-content-${message.codigo}`}
                                    message={message}
                                    openModalTooltip={openModalTooltip}
                                    isSharedChat={isSharedChat}
                                    profile={profile}
                                />
                            </Box>
                        </Box>

                        <div className='message__icones-texto'>
                            <Actions
                                key={`msg-box-msg-actions-${message.codigo}`}
                                message={conteudo}
                                cod_message={codigo ?? ''}
                                reacao={feedback?.reacao}
                                onOpenFeedbackDialog={handleOpenFeedbackDialog}
                            />
                        </div>
                        {isOpenFeedbackDialog && (
                            <div className='message__feedback'>
                                <FeedbackDialog
                                    onCancel={handleCloseFeedbackDialog}
                                    onSend={handleSendFeedback}
                                    chat_id={activeChat?.id ?? ''}
                                    cod_mensagem={codiMessageFeedback}
                                    reacao={reacao}
                                    setReacao={setReacao}
                                    setIsShowSucessSnack={setIsShowSucessSnack}
                                    setIsShowErrorSnack={setIsShowErrorSnack}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
            <MessageToast
                data-testid='feedback-erro-message'
                severity='warning'
                show={isShowErrorSnack}
                msg='Erro ao enviar feedback.'
                onClose={() => setIsShowErrorSnack(false)}
            />

            <MessageToast
                data-testid='feedback-success-message'
                severity='success'
                show={isShowSucessSnack}
                msg='Feedback enviado.'
                onClose={() => setIsShowSucessSnack(false)}
            />
        </>
    )
}

export default Message
