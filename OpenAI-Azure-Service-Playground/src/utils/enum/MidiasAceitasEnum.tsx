type MidiasAceitasEnum = {
    PDF: { label: 'pdf'; icon: string; extensaoSimplificada: string }
    DOCX: { label: 'docx'; icon: string; extensaoSimplificada: string }
    XLSX: { label: 'xlsx'; icon: string; extensaoSimplificada: string }
    LINK: { label: 'link'; icon: string; extensaoSimplificada: string }
    CSV: { label: 'csv'; icon: string; extensaoSimplificada: string }
}

export const MidiasAceitasEnum: MidiasAceitasEnum = {
    PDF: { label: 'pdf', icon: 'icon-pdf', extensaoSimplificada: 'pdf' },
    DOCX: {
        label: 'docx',
        icon: 'icon-doc-word',
        extensaoSimplificada: 'vnd.openxmlformats-officedocument.wordprocessingml.document'
    },
    XLSX: {
        label: 'xlsx',
        icon: 'icon-xls-excel',
        extensaoSimplificada: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    LINK: { label: 'link', icon: 'icon-link', extensaoSimplificada: '' },
    CSV: { label: 'csv', icon: 'icon-xls-excel', extensaoSimplificada: 'csv' }
}

export const listMidiasAceitas = () => {
    return Object.values(MidiasAceitasEnum)
}

export const getMidiaByExtensao = (extensao: string) => {
    if (extensao) {
        const extensaoSimplificada = extensao.replace(
            /^(application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application|audio|video|text)\//,
            ''
        )

        for (const key in MidiasAceitasEnum) {
            if (MidiasAceitasEnum[key as keyof MidiasAceitasEnum].extensaoSimplificada === extensaoSimplificada) {
                return MidiasAceitasEnum[key as keyof MidiasAceitasEnum]
            }
        }
    } else {
        return undefined
    }
}
