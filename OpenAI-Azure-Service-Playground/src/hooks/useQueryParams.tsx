import { useEffect, useState } from 'react'

const useQueryParams = () => {
    const [queryParams, setQueryParams] = useState<{}>()
    const [tknPortal, setTknPortal] = useState<string | null>()

    const method = {
        get: (key: string) => {
            if (queryParams) return queryParams[key]

            return undefined
        },
        getTknPortal: () => {
            return tknPortal
        }
    }

    useEffect(() => {
        // Get the current URL
        const url = new URL(window.location.href)

        // Get the search parameters from the URL
        const searchParams = new URLSearchParams(url.search)

        // Create an object to store the query parameters
        const params = {}

        // Get the keys of the search parameters
        const keys = Array.from(searchParams.keys())

        // Iterate over the keys and add them to the object
        for (const key of keys) {
            params[key] = searchParams.get(key)

            if (key === '/ServletTcuLoginIntegrado?tkn' || key === 'tkn') setTknPortal(searchParams.get(key))
        }

        // Update the state with the query parameters
        setQueryParams(params)
    }, [])

    return method
}

export default useQueryParams
