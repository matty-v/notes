import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home'
import { SheetsSetupWizard } from '@/components/sheets'
import { AnimatedBackground } from '@/components/animated-background'
import { useSettings } from '@/hooks/use-settings'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

// Ensure dark mode is always enabled
document.documentElement.classList.add('dark')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AppContent() {
  const { spreadsheetId, connectSpreadsheet, isInitializing } = useSettings()
  const [inputValue, setInputValue] = useState('')

  const handleConnect = async () => {
    await connectSpreadsheet(inputValue)
  }

  if (!spreadsheetId) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <SheetsSetupWizard
            serviceAccountEmail={SERVICE_ACCOUNT_EMAIL}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onConnect={handleConnect}
            isConnecting={isInitializing}
            title="Notes Setup"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
