import { Box } from '@mui/material'
import Panel from '../panel/Panel'
import DotsLoader from '../dots-loader/DotsLoader'
import Message from './message/Message'
import { IChat } from '../../infrastructure/utils/types'
import { IUserInfo } from '../../hooks/useUserInfo'

interface IMessageBox {
    isSharedChat: boolean
    scrollArea: React.RefObject<HTMLDivElement>
    chat: IChat | null
    setChat: any
    submitChatMessage: (manualPrompt?: string) => Promise<void>
    profile: IUserInfo
    stopTyping: any
    shouldScrollToBottom: any
}

const MessageBox: React.FC<IMessageBox> = ({
    isSharedChat,
    scrollArea,
    chat,
    setChat,
    submitChatMessage,
    profile,
    stopTyping,
    shouldScrollToBottom
}) => {
    return (
        <Box
            key={`msg-box-message-${chat?.id}`}
            className='chat-box__scroll'
            ref={scrollArea}>
            <Box
                key={'chat-box'}
                className='chat-box__container'
                data-testid='chat-messages'>
                {!chat?.mensagens.length ? (
                    <Panel
                        profile={profile}
                        submitChatMessage={submitChatMessage}
                    />
                ) : (
                    chat.mensagens.map((message, index) => {
                        const lastMessageIndex = chat.mensagens.length - 1
                        const lastMessagePapel = chat.mensagens[lastMessageIndex].papel === 'ASSISTANT'
                        return chat.isLoading && lastMessagePapel && lastMessageIndex === index ? (
                            <DotsLoader key={`dots-loader-${message.codigo}`} />
                        ) : (
                            <Message
                                activeChat={chat}
                                setActiveChat={setChat}
                                key={`msg-box-message-${chat.id}-${message.codigo}`}
                                isSharedChat={isSharedChat}
                                profile={profile}
                                message={message}
                                isLastMessage={lastMessageIndex === index}
                                stopTyping={stopTyping}
                                shouldScrollToBottom={shouldScrollToBottom}
                                scrollArea={scrollArea}
                            />
                        )
                    })
                )}
            </Box>
        </Box>
    )
}

export default MessageBox
