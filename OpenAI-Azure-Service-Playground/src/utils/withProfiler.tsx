import { Profiler } from 'react'

const withProfiler = WrappedComponent => {
    const renderCount = {
        [WrappedComponent.name]: 0
    }

    return props => {
        const onRenderCallback = (id, phase, actualDuration) => {
            if (phase === 'update' || phase === 'render') {
                const durationInSeconds = actualDuration / 1000
                console.log(durationInSeconds)
                renderCount[id] = (renderCount[id] || 0) + 1
            }
        }

        return (
            <Profiler
                id={WrappedComponent.name}
                onRender={onRenderCallback}>
                <WrappedComponent {...props} />
            </Profiler>
        )
    }
}

export default withProfiler
