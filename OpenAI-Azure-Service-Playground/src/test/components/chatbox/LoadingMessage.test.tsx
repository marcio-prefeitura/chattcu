import { render } from '@testing-library/react'
import LoadingMessage from '../../../components/chat-box/loading-message/LoadingMessage'

describe('LoadingMessage', () => {
    it('should render the loading message', () => {
        const { getByText } = render(<LoadingMessage />)

        const loadingElement = getByText('.')

        expect(loadingElement).toHaveClass('circle')
    })
})
