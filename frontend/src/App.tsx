import { Routes, Route } from 'react-router-dom'
import { useTheme } from './contexts/ThemeContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'

function App() {
    const { theme } = useTheme()

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Layout />}>

                </Route>
            </Routes>
        </div>
    )
}

export default App