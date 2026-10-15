import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
test('maximum accepted content stays inside reserved panels at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  const value = structuredClone(fixture)
  value.name = 'W'.repeat(80)
  value.introduction = 'I'.repeat(240)
  value.sections = Array.from({ length: 12 }, (_, i) => ({
    id: `chapter-${i}`,
    title: 'T'.repeat(80),
    body: 'B'.repeat(3000),
  }))
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('heading', { name: value.name, level: 1, exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add chapter', exact: true })).toBeDisabled()
  await expect(page.locator('[data-ui="reader"] [data-section]')).toHaveCount(12)
  await page.locator('[data-ui="reader"]').evaluate((e) => (e.scrollTop = e.scrollHeight))
  await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute(
    'value',
    '100',
  )
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
