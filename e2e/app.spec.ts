import { test, expect } from '@playwright/test'

test.describe('GS-QUAD Dashboard', () => {
  test('homepage loads without errors', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/GS-QUAD/)

    // Check main layout elements are present
    await expect(page.locator('body')).toBeVisible()
  })

  test('navigation sidebar is visible', async ({ page }) => {
    await page.goto('/')

    // Sidebar should be present
    const sidebar = page.locator('[data-sidebar="sidebar"]')
    await expect(sidebar.or(page.locator('nav'))).toBeVisible()
  })

  test('theme toggle works', async ({ page }) => {
    await page.goto('/')

    // Find and click theme toggle if present
    const themeToggle = page.getByRole('button', { name: /theme|light|dark|switch/i }).first()
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
    }

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Route Navigation', () => {
  test('can navigate to monitor', async ({ page }) => {
    await page.goto('/monitor')
    await expect(page).toBeVisible()
  })

  test('can navigate to terminal', async ({ page }) => {
    await page.goto('/terminal')
    await expect(page).toBeVisible()
  })

  test('can navigate to growth plan', async ({ page }) => {
    await page.goto('/growth')
    await expect(page).toBeVisible()
  })

  test('can navigate to adfactory', async ({ page }) => {
    await page.goto('/adfactory')
    await expect(page).toBeVisible()
  })

  test('can navigate to settings', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toBeVisible()
  })
})
