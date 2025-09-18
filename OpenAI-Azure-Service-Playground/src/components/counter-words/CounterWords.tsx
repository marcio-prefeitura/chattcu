import { Tooltip } from '@mui/material'
import React from 'react'

interface CounterWordsProps {
    count: number
    total: number
}

const CounterWords: React.FC<CounterWordsProps> = ({ count, total }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const newChatButton = document.querySelector('[data-testid="new-chat"]') as HTMLElement
        if (newChatButton) {
            newChatButton.click()
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleClick(event as any)
        }
    }

    return (
        <>
            {count < total ? (
                <label
                    htmlFor='contador-input'
                    className='chat-box__contador'
                    data-testid='contador-input'>
                    {count} / {total}
                </label>
            ) : (
                <label
                    htmlFor='contador-input-max'
                    className='chat-box__contador chat-blocked'
                    data-testid='contador-input-max'>
                    <Tooltip title='Você atingiu o limite de palavras'>
                        <span className='icon-alert-circle' />
                    </Tooltip>
                    Limite excedido,{' '}
                    <span
                        onClick={handleClick}
                        onKeyDown={handleKeyDown}
                        role='button'
                        tabIndex={0}
                        className='chat-box__dica-link'>
                        crie um novo chat
                    </span>{' '}
                    para continuar
                </label>
            )}
        </>
    )
}

export default CounterWords
