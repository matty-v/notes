import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home'
import { SheetsSetupWizard } from '@/components/sheets'
import { AnimatedBackground } from '@/components/animated-background'
import { BlockingOverlayProvider } from '@/components/blocking-overlay'
import { Toaster } from '@/components/ui/toaster'
import { useSources } from '@/hooks/use-sources'
import { useSettings } from '@/hooks/use-settings'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'
import { extractSpreadsheetId } from '@/lib/spreadsheet-id'

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
  const { sources, addSource, setActiveSourceId } = useSources()
  const { initializeSheets, isInitializing } = useSettings()
  const [inputValue, setInputValue] = useState('')

  const handleConnect = async () => {
    // Strip a pasted Sheets URL down to the bare spreadsheet id so the
    // downstream calls don't store the URL itself as the id and silently
    // fail every subsequent API request.
    const spreadsheetId = extractSpreadsheetId(inputValue)
    const success = await initializeSheets(spreadsheetId)
    if (success) {
      const source = addSource('Primary Notes', spreadsheetId)
      setActiveSourceId(source.id)
    }
  }

  if (sources.length === 0) {
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
      <BlockingOverlayProvider>
        <AppContent />
        <Toaster />
      </BlockingOverlayProvider>
    </QueryClientProvider>
  )
}

export default App
