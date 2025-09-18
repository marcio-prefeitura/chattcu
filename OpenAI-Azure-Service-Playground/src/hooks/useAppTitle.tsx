import { useEffect, useState } from 'react'

export const useAppTitle = () => {
    const [appTitle, setAppTitle] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (appTitle) document.title = appTitle
    }, [appTitle])

    return setAppTitle
}
