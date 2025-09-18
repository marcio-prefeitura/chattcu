import { AlertColor } from '@mui/material'
import { useState, useCallback } from 'react'
import { IMessageToastProps } from '../components/message-toast/MessageToast'

const useAlert = () => {
    const [alert, setAlert] = useState<IMessageToastProps>()
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

    const handleAlert = useCallback(
        (severity: AlertColor | undefined, MessageToast: string, duration = 6000) => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
            const alerta = {
                show: true,
                severity: severity,
                msg: MessageToast,
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

    return { alert, handleAlert }
}

export function isNullOrUndefined(valor: any) {
    return valor === null || typeof valor === 'undefined' || valor === ''
}

export function transformArrayStringToArray(list: any) {
    if (isNullOrUndefined(list) || !list.length) {
        return null
    }
    return typeof list === 'string' ? list.split(',').map(Number) : [list]
}

export default useAlert
