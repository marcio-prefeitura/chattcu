import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NotFound from '../../pages/NotFound'
import ChatPage from '../../pages/chatpage/ChatPage'

const CustomRoutes = ({ toggleDarkMode, darkMode }) => {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    exact
                    path='/'
                    element={
                        <ChatPage
                            darkMode={darkMode}
                            toggleDarkMode={toggleDarkMode}
                        />
                    }
                />
                <Route
                    exact
                    path='/share'
                    element={
                        <ChatPage
                            darkMode={darkMode}
                            toggleDarkMode={toggleDarkMode}
                        />
                    }
                />
                <Route
                    path='/chat/:chat_id'
                    element={
                        <ChatPage
                            darkMode={darkMode}
                            toggleDarkMode={toggleDarkMode}
                        />
                    }
                />

                <Route
                    path='*'
                    element={<NotFound />}
                />
            </Routes>
        </BrowserRouter>
    )
}

export default CustomRoutes
