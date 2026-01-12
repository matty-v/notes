import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home'
import { SheetsSetupWizard } from '@/components/sheets'
import { useSettings } from '@/hooks/use-settings'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <SheetsSetupWizard
          serviceAccountEmail={SERVICE_ACCOUNT_EMAIL}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onConnect={handleConnect}
          isConnecting={isInitializing}
          title="Notes Setup"
        />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
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
