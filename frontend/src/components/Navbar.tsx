import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
    const { theme } = useTheme()

    return (
        <nav className="bg-bg-primary border-b border-border shadow-custom-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Right side - Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-primary font-cairo">
                                مجموعة الجندي للزجاج
                            </h1>
                        </div>
                    </div>

                    {/* Left side - User menu and theme toggle */}
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <ThemeToggle />

                        {/* User Avatar & Menu */}
                        <div className="relative">
                            <button
                                type="button"
                                className="flex items-center space-x-2 space-x-reverse text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">م</span>
                                </div>
                                <span className="text-text-primary font-medium">محمد أحمد</span>
                                <svg
                                    className="h-4 w-4 text-text-secondary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}