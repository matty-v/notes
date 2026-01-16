import { test, expect } from '@playwright/test'

test.describe('Voice Recording', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone'])
    await page.goto('/')
  })

  test('should display microphone button in note form', async ({ page }) => {
    // Check if the microphone button is visible
    const micButton = page.locator('button[title*="voice recording"]')
    await expect(micButton).toBeVisible()
  })

  test('should toggle recording state when microphone button is clicked', async ({ page }) => {
    // Mock the SpeechRecognition API since Playwright doesn't have real speech input
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        lang = ''
        continuous = false
        interimResults = false
        onresult: ((event: any) => void) | null = null
        onerror: ((event: any) => void) | null = null
        onend: (() => void) | null = null

        start() {
          // Simulate a successful start
          setTimeout(() => {
            if (this.onresult) {
              const event = {
                resultIndex: 0,
                results: [
                  {
                    0: { transcript: 'Test voice input', confidence: 0.9 },
                    isFinal: true,
                    length: 1,
                    item: () => ({ transcript: 'Test voice input', confidence: 0.9 }),
                  },
                ],
              }
              this.onresult(event)
            }
          }, 100)
        }

        stop() {
          if (this.onend) {
            this.onend()
          }
        }

        abort() {
          if (this.onend) {
            this.onend()
          }
        }
      }

      ;(window as any).SpeechRecognition = MockSpeechRecognition
      ;(window as any).webkitSpeechRecognition = MockSpeechRecognition
    })

    await page.reload()

    const micButton = page.locator('button[title*="voice recording"]')

    // Click to start recording
    await micButton.click()

    // Wait a bit for the mock to trigger
    await page.waitForTimeout(200)

    // Check that transcript was added to textarea
    const textarea = page.locator('textarea[placeholder*="Write your note"]')
    await expect(textarea).toHaveValue(/Test voice input/)
  })

  test('should show error when microphone permission is denied', async ({ page, context }) => {
    // Deny microphone permissions
    await context.clearPermissions()

    await page.addInitScript(() => {
      class MockSpeechRecognition {
        lang = ''
        continuous = false
        interimResults = false
        onresult: ((event: any) => void) | null = null
        onerror: ((event: any) => void) | null = null
        onend: (() => void) | null = null

        start() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({ error: 'not-allowed', message: 'Permission denied' })
            }
            if (this.onend) {
              this.onend()
            }
          }, 100)
        }

        stop() {
          if (this.onend) {
            this.onend()
          }
        }

        abort() {
          if (this.onend) {
            this.onend()
          }
        }
      }

      ;(window as any).SpeechRecognition = MockSpeechRecognition
      ;(window as any).webkitSpeechRecognition = MockSpeechRecognition
    })

    await page.reload()

    const micButton = page.locator('button[title*="voice recording"]')

    // Click to start recording
    await micButton.click()

    // Wait for error to appear
    await page.waitForTimeout(200)

    // Check that error message is displayed
    await expect(page.locator('text=/permission/i')).toBeVisible()
  })

  test('should not show microphone button when speech recognition is not supported', async ({ page }) => {
    // Mock unsupported browser
    await page.addInitScript(() => {
      delete (window as any).SpeechRecognition
      delete (window as any).webkitSpeechRecognition
    })

    await page.reload()

    // Microphone button should not be visible
    const micButton = page.locator('button[title*="voice recording"]')
    await expect(micButton).not.toBeVisible()
  })

  test('should stop recording when form is submitted', async ({ page }) => {
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        lang = ''
        continuous = false
        interimResults = false
        onresult: ((event: any) => void) | null = null
        onerror: ((event: any) => void) | null = null
        onend: (() => void) | null = null

        start() {
          // No-op for mock
        }

        stop() {
          if (this.onend) {
            this.onend()
          }
        }

        abort() {
          if (this.onend) {
            this.onend()
          }
        }
      }

      ;(window as any).SpeechRecognition = MockSpeechRecognition
      ;(window as any).webkitSpeechRecognition = MockSpeechRecognition
    })

    await page.reload()

    // Fill in the title
    await page.fill('input[placeholder*="Note title"]', 'Test Note')

    const micButton = page.locator('button[title*="voice recording"]')

    // Start recording
    await micButton.click()

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for the form to be processed
    await page.waitForTimeout(500)

    // The recording should have stopped (button should show "Start" state)
    await expect(micButton).toHaveAttribute('title', /Start voice recording/i)
  })
})
