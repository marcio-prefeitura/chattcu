import { createContext, useContext, ReactNode, useMemo, useState, useCallback } from 'react'
import { AlertColor } from '@mui/material'
import { IMessageToastProps } from '../components/message-toast/MessageToast'

interface AlertContextProps {
    alert: IMessageToastProps | undefined
    handleAlert: (severity: AlertColor | undefined, message: string, duration?: number) => void
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined)

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [alert, setAlert] = useState<IMessageToastProps>()
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

    const handleAlert = useCallback(
        (severity: AlertColor | undefined, message: string, duration = 6000) => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
            const alerta = {
                show: true,
                severity: severity,
                msg: message,
                duration: duration,
                onClose: () => setAlert({ ...alerta, show: false })
            }
            setAlert(alerta)
            const id = setTimeout(() => {
                setAlert({ ...alerta, show: false })
            }, duration)
            setTimeoutId(id)
        },
        [timeoutId]
    )

    // Memoizar o valor do contexto para evitar novas renderizações desnecessárias
    const contextValue = useMemo(
        () => ({
            alert,
            handleAlert
        }),
        [alert, handleAlert]
    )

    return <AlertContext.Provider value={contextValue}>{children}</AlertContext.Provider>
}

export const useAlert = (): AlertContextProps => {
    const context = useContext(AlertContext)
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider')
    }
    return context
}
