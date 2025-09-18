import { createContext } from 'react'

const inTeams = window.parent !== window
export const InTeamsContext = createContext(inTeams)
