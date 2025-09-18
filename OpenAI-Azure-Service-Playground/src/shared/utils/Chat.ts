export const removeQuotes = (text?: string) => {
    if (!text) return
    return text.replace(/["']/g, '')
}

export const setInitialTitle = (text: string) => {
    return text.slice(0, 20) + '...'
}
