export class LanguageHandler {
    private language: string
    private textContent: string

    constructor(part: string) {
        this.language = this.extractLanguage(part)
        this.textContent = this.replaceLanguage(part, this.language)
    }

    private extractLanguage(part: string): string {
        const lines = part.split('\n')
        if (lines.length === 0) {
            return ''
        }
        return lines[0]
    }

    private replaceLanguage(part: string, language: string): string {
        return part.replace(language, '')
    }

    getLanguage(): string {
        return this.language
    }

    getTextContent(): string {
        return this.textContent
    }

    getAsObject(): { language: string; textContent: string } {
        return {
            language: this.language,
            textContent: this.textContent
        }
    }
}
