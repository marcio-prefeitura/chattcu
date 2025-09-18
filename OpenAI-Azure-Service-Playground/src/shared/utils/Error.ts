const errorStatus = [400, 401]

export const errorHandler = (status?: number) => {
    if (!status) return false

    return errorStatus.includes(status)
}
