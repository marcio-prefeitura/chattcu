import { useState } from 'react'

type UseCopyToClipboardReturn = {
    copyToClipboard: (text: string) => void
    hasCopied: boolean
}

export const useCopyToClipboard = (resetDuration = 2000): UseCopyToClipboardReturn => {
    const [hasCopied, setHasCopied] = useState<boolean>(false)

    const copyToClipboard = async (text: string) => {
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(text)
                setHasCopied(true)

                setTimeout(() => {
                    setHasCopied(false)
                }, resetDuration)
            } catch (error) {
                console.error('Failed to copy text to clipboard:', error)
            }
        } else {
            console.warn('Clipboard API not available.')
        }
    }

    return { copyToClipboard, hasCopied }
}
