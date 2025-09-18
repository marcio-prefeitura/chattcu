export const handleCopyLink = (chatId, handleAlert) => {
    const link = `${process.env.REACT_APP_BACK_ENDPOINT}/share?share_id=${chatId}`
    navigator.clipboard
        .writeText(link)
        .then(() => {
            handleAlert('success', 'Link copiado para a área de transferência', 3000)
        })
        .catch(error => {
            handleAlert('error', 'Erro ao copiar o link')
            console.error('Erro ao copiar o link:', error)
        })
}
