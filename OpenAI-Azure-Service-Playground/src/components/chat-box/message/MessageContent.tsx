import React, { useState } from 'react'
import { Box } from '@mui/material'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import LoadingMessage from '../loading-message/LoadingMessage'
import SyntaxCodeHighlighter from './syntax-code-highlighter/SyntaxCodeHighlighter'
import CitationButton from './CitationButton'
import MarkdownLink from './markdown-link/markdown-link'
import linguagensDeProgramacao from '../../../shared/utils/Languages.json'
import { IMessageHistory } from '../../../infrastructure/utils/types'
import { v4 as uuidv4 } from 'uuid'
import { IUserInfo } from '../../../hooks/useUserInfo'

interface IMessageContent {
    message: IMessageHistory
    openModalTooltip: (trecho: any | undefined) => void
    isSharedChat: boolean
    profile?: IUserInfo
}

const MessageContent: React.FC<IMessageContent> = ({ message, openModalTooltip, isSharedChat, profile }) => {
    const { codigo, conteudo, papel } = message
    const [citations, setCitations] = useState<any[]>([])
    let conteudoEmPartes
    let coutCitationButton = 0

    const replaceContentWithCitation = text => {
        const partes = text.split('\n')
        return partes.map(parte => {
            coutCitationButton++
            return (
                <CitationButton
                    data-testid='cit-button-msg'
                    key={`cit-button-msg-${codigo}-${coutCitationButton}`}
                    message={message}
                    openModalTooltip={openModalTooltip}
                    i={coutCitationButton}
                    parte={parte}
                    getCitations={() => citations}
                    setCitations={setCitations}
                    disabled={isSharedChat}
                    profile={profile}
                />
            )
        })
    }

    const processAssistantContent = (texto: string, lines: string[], textoEmPartes: string[], index: number) => {
        if (isCode(texto)) {
            return (
                <SyntaxCodeHighlighter
                    data-testid='messagem_highlighter'
                    key={`highlighter-${codigo}-${index}`}
                    texto={texto}
                    index={index}
                    conteudoEmPartes={conteudoEmPartes}
                />
            )
        }

        if (isTable(texto)) {
            return (
                <div
                    data-testid='markdown-table'
                    key={`markdown-msg-${codigo}`}
                    className='message__markdown'>
                    {textoEmPartes.map(item => {
                        return typeof item === 'string' && item.startsWith('|') && item.endsWith('|') ? (
                            <div className='message__table'>
                                <Markdown
                                    key={`markdown-table-${codigo}`}
                                    remarkPlugins={[remarkGfm]}>
                                    {item}
                                </Markdown>
                            </div>
                        ) : (
                            <Markdown
                                key={`markdown-${codigo}`}
                                remarkPlugins={[remarkGfm]}>
                                {item}
                            </Markdown>
                        )
                    })}
                </div>
            )
        }

        if (texto.includes('[')) {
            const hasValidLink = /\[/.test(texto) && /\]/.test(texto) && /\(/.test(texto) && /\)/.test(texto)
            return hasValidLink ? (
                <MarkdownLink
                    data-test='markdown-link'
                    conteudo={texto}
                    key={`mdlink-${codigo}`}
                />
            ) : (
                replaceContentWithCitation(texto)
            )
        }

        const uuid = uuidv4()
        return (
            <div
                key={`c-${codigo}-${uuid}`}
                className='message__box-paragrafo-chattcu'>
                {lines.map((line, i) => {
                    const idtemp = `line-inner-${codigo}-${uuid}-${i}`
                    return (
                        <div key={idtemp}>
                            <Markdown
                                key={`markdown-text-${codigo}-${uuid}`}
                                remarkPlugins={[remarkGfm]}>
                                {line}
                            </Markdown>
                            {i < lines.length - 1 && (
                                <span
                                    key={`box-par-${codigo}-${uuid}`}
                                    className='message__box-paragrafo-chattcu'
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    const isTableRow = (text: string) => typeof text === 'string' && text.startsWith('|') && text.endsWith('|')

    const processTableContent = (prev: string[], curr: string) => {
        const lastLine = prev.pop()
        if (lastLine && isTableRow(lastLine) && isTableRow(curr)) {
            prev.push(lastLine + '\n' + curr)
        } else {
            if (lastLine) prev.push(lastLine)
            prev.push(curr)
        }
        return prev
    }
    const renderContent = () => {
        const conteudoComTrechos = conteudo
        conteudoEmPartes = []
        if (conteudoComTrechos) {
            conteudoEmPartes = conteudoComTrechos.split(/```/g)
        }

        const content = conteudoEmPartes.map((texto, index) => {
            const lines = texto.split('\n')

            if (papel === 'ASSISTANT') {
                const textoEmPartes = lines.reduce((prev, curr) => {
                    if (isTableRow(curr)) {
                        return processTableContent(prev, curr)
                    }
                    prev.push(curr)
                    return prev
                }, [])

                return processAssistantContent(texto, lines, textoEmPartes, index)
            }

            const uuid = uuidv4()
            return (
                <React.Fragment key={`msg-content-${codigo}-${uuid}`}>
                    <>
                        {lines.map((line, i) => {
                            const idtemp = `${codigo}-${uuid}-${i}`
                            return (
                                <React.Fragment key={`line-msg-${idtemp}`}>
                                    {line}
                                    {i < lines.length - 1 && (
                                        <span
                                            key={`box-par-line-msg-${idtemp}`}
                                            className='message__box-paragrafo-chattcu'
                                        />
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </>
                </React.Fragment>
            )
        })
        return content
    }

    const isTable = (texto: string): boolean => {
        const regex = /\|.*?\|/
        return regex.test(texto)
    }

    const isCode = (texto: string): boolean => {
        const regex = /^(\w+)/
        const match = regex.exec(texto)
        return match && match.length > 1 ? linguagensDeProgramacao.includes(match[1]) : false
    }

    return (
        <>
            {papel === 'USER' && <div className='message__user-question'>{renderContent()}</div>}
            {papel === 'ASSISTANT' && (
                <Box className='message__box-avatar-text-chattcu'>
                    <Box className='message__box-paragrafo-chattcu'>
                        {renderContent()}
                        {message.isStreamActive && <LoadingMessage />}
                    </Box>
                </Box>
            )}
        </>
    )
}

export default MessageContent
