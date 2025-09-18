import React, { useState } from 'react'
import { Box } from '@mui/material'
import { IMessageHistory } from '../../../infrastructure/utils/types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CitationInner, { ICitation } from '../../citation-inner/CitationInner'
import { IUserInfo } from '../../../hooks/useUserInfo'

interface ICitationButton {
    message: IMessageHistory
    parte: any
    i: number
    openModalTooltip: (trecho: any | undefined) => void
    getCitations: () => any[]
    setCitations: React.Dispatch<React.SetStateAction<any[]>>
    disabled?: boolean
    profile?: IUserInfo
}

const CitationButton: React.FC<ICitationButton> = ({ message, parte, i, getCitations, setCitations, disabled }) => {
    const { trechos, codigo, papel } = message
    const [activeIndex, setActiveIndex] = useState<Set<number>>(new Set())

    let conteudo_texto = ''
    let content = []
    conteudo_texto = parte

    const findIndexByCriteria = (source: string, trechos: any[]): number => {
        let index = trechos.findIndex(trecho => `[${trecho.id_registro}]` === source)

        if (index === -1) {
            const sourceWithFilePrefix = source.replace('[', '[Arquivo ')
            index = trechos.findIndex(trecho => `[${trecho.id_registro}]` === sourceWithFilePrefix)
        }

        if (index === -1) {
            index = trechos.findIndex(trecho => `[${trecho.pagina_arquivo}]` === source)
        }

        return index
    }

    const returnSourceByCitation = (source: string) => {
        let index: number | undefined = undefined
        let trecho: any | undefined = undefined
        const citations = getCitations()

        // Tenta converter diretamente para número
        if (!isNaN(Number(source.replace('^', '')))) {
            index = parseInt(source.replace('^', '')) - 1
        } else {
            index = findIndexByCriteria(source, trechos!)
        }

        if (index >= 0) {
            trecho = trechos![index]
            const citationIndex = citations.findIndex(cit => cit.id_registro === trecho.id_registro)

            if (citationIndex === -1) {
                citations.push(trecho)
                setCitations(() => Array.from(new Set(citations)))
                index = citations.length
            } else {
                index = citationIndex + 1
            }
        }

        return { trecho, index }
    }

    if (parte.includes('[')) {
        const hasValidCitation = /\[/.test(parte) && /\]/.test(parte)

        if (hasValidCitation) {
            const conteudo = parte
                .split(/(\[[^[\]]*\])/)
                .filter(Boolean)
                .map(part => part.trim())

            conteudo_texto = conteudo[0]
            content = conteudo.slice(1)
        } else {
            conteudo_texto = parte
            content = []
        }
    }

    const citationsGroup: Set<ICitation> = new Set<ICitation>()
    const toggleActiveIndex = (index: number) => {
        setActiveIndex(prevSet => {
            const newSet = new Set(prevSet)
            newSet.has(index) ? newSet.delete(index) : newSet.add(index)
            return newSet
        })
    }

    const renderCitationButtonInnerChat = (index: number) => {
        return (
            <Box
                className={`message__reference ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && toggleActiveIndex(index)}>
                <sup className={activeIndex.has(index) ? 'toggled' : ''}>{index}</sup>
            </Box>
        )
    }

    const markdownId = `markdown-text-${i}-${codigo}`
    return (
        <Box className='message'>
            <Markdown
                key={markdownId}
                remarkPlugins={[remarkGfm]}>
                {conteudo_texto}
            </Markdown>
            {content.map((text: string, idx) => {
                if (papel === 'ASSISTANT') {
                    const { trecho, index } = returnSourceByCitation(text)
                    const temp = `b-${i}-${codigo}-${idx}`

                    if (trecho) {
                        const citation: ICitation = {
                            key: `cit-${temp}-`,
                            isFile: message?.arquivos_busca === 'Arquivos',
                            trecho: trecho,
                            disabled: disabled,
                            index: index,
                            activeIndex: activeIndex
                        }
                        citationsGroup.add(citation)
                        const keyAuxFragment = `f-${codigo}-idx-${idx}`
                        return (
                            <React.Fragment key={keyAuxFragment}>{renderCitationButtonInnerChat(index)}</React.Fragment>
                        )
                    } else {
                        return text
                    }
                } else {
                    return text
                }
            })}
            {
                <div className='message__espaco-paragrafo'>
                    {Array.from(citationsGroup).map(cit => {
                        if (activeIndex.has(cit.index)) {
                            return (
                                <CitationInner
                                    key={cit.key}
                                    citation={cit}
                                    toggleActiveIndex={toggleActiveIndex}
                                />
                            )
                        }
                        return null
                    })}
                </div>
            }
        </Box>
    )
}

export default CitationButton
