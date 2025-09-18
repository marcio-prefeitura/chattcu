import { render } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import CustomTabPanel from '../../../components/sidebar/CustomTabPanel'

describe('CustomTabPanel', () => {
    const renderComponent = props => {
        return render(<CustomTabPanel {...props} />)
    }

    it('should render children when value matches index', () => {
        const { getByText } = renderComponent({
            value: 0,
            index: 0,
            children: <div>Test Content</div>
        })

        expect(getByText('Test Content')).toBeInTheDocument()
    })

    it('should not render children when value does not match index', () => {
        const { queryByText } = renderComponent({
            value: 1,
            index: 0,
            children: <div>Test Content</div>
        })

        expect(queryByText('Test Content')).not.toBeInTheDocument()
    })

    it('should have the correct role attribute', () => {
        const { getByRole } = renderComponent({
            value: 0,
            index: 0
        })

        expect(getByRole('tabpanel')).toBeInTheDocument()
    })

    it('should have the correct id and aria-labelledby attributes', () => {
        const { getByRole } = renderComponent({
            value: 0,
            index: 0
        })

        const tabPanel = getByRole('tabpanel')
        expect(tabPanel).toHaveAttribute('id', 'simple-tabpanel-0')
        expect(tabPanel).toHaveAttribute('aria-labelledby', 'simple-tab-0')
    })
})
