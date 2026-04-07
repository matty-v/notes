export interface SheetsSetupWizardProps {
  serviceAccountEmail: string
  inputValue: string
  onInputChange: (value: string) => void
  onConnect: () => void | Promise<void>
  isConnecting?: boolean
  title?: string
  connectButtonText?: string
  connectingButtonText?: string
  inputPlaceholder?: string
  additionalInstructions?: React.ReactNode
}
