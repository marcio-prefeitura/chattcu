import React from 'react'
import MessageToastDownload from '../message-toast/MessageToastDownload'
import MessageToast from '../message-toast/MessageToast'
import MensagemErro from '../message-toast/MessageToastError'

interface MessageToastGroupProps {
    isDownloading: boolean
    copyShowSucess: boolean
    copySucessMessage: string
    copyShowError: boolean
    copyErrorMessage: string[]
    moveShowSucess: boolean
    moveSucessMessage: string
    moveShowError: boolean
    moveErrorMessage: string[]
    setIsDownloading: (value: boolean) => void
    setShowCopySuccess: (value: boolean) => void
    setShowCopyError: (value: boolean) => void
    setShowMoveSuccess: (value: boolean) => void
    setMoveShowError: (value: boolean) => void
}

const MessageToastGroup: React.FC<MessageToastGroupProps> = ({
    isDownloading,
    copyShowSucess,
    copySucessMessage,
    copyShowError,
    copyErrorMessage,
    moveShowSucess,
    moveSucessMessage,
    moveShowError,
    moveErrorMessage,
    setIsDownloading,
    setShowCopySuccess,
    setShowCopyError,
    setShowMoveSuccess,
    setMoveShowError
}) => {
    return (
        <div>
            <MessageToastDownload
                show={isDownloading}
                message='Download iniciado, aguarde...'
                onClose={() => setIsDownloading(false)}
            />
            <MessageToast
                severity='info'
                show={copyShowSucess}
                msg={copySucessMessage}
                duration={5}
                onClose={() => setShowCopySuccess(false)}
            />
            <MensagemErro
                severity='warning'
                show={copyShowError}
                initialMsg={copyErrorMessage}
                duration={5}
                onClose={() => setShowCopyError(false)}
            />
            <MessageToast
                severity='info'
                show={moveShowSucess}
                msg={moveSucessMessage}
                duration={5}
                onClose={() => setShowMoveSuccess(false)}
            />
            <MensagemErro
                severity='warning'
                show={moveShowError}
                initialMsg={moveErrorMessage}
                duration={5}
                onClose={() => setMoveShowError(false)}
            />
        </div>
    )
}

export default MessageToastGroup
