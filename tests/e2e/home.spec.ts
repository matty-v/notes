import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the welcome heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome')
  })

  test('should navigate to example page', async ({ page }) => {
    await page.goto('/')
    await page.click('text=View Example')
    await expect(page).toHaveURL('/example')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Component Examples')
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')
    await page.click('nav >> text=Example')
    await expect(page).toHaveURL('/example')
    await page.click('nav >> text=Home')
    await expect(page).toHaveURL('/')
  })
})
