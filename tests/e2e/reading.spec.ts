import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
test('real scroll and chapter navigation update reading cues and focus', async ({ page }) => {
  await page.goto('/')
  const reader = page.locator('[data-ui="reader"]'),
    navigation = page.getByRole('navigation', { name: 'Reading chapters' })
  await expect(navigation.locator('[aria-current="location"]')).toHaveAccessibleName(
    'Read Begin with a conversation',
  )
  await navigation
    .getByRole('button', { name: 'Read Plant something forgiving', exact: true })
    .click()
  await expect(navigation.locator('[aria-current="location"]')).toHaveAccessibleName(
    'Read Plant something forgiving',
  )
  await expect(reader.locator('[data-section="plant"]')).toBeFocused()
  const value = await page
    .getByRole('progressbar', { name: 'Reading progress' })
    .getAttribute('value')
  expect(Number(value)).toBeGreaterThan(10)
  await reader.focus()
  await page.keyboard.press('End')
  await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute(
    'value',
    '100',
  )
  await expect(navigation.locator('[aria-current="location"]')).toHaveAccessibleName(
    'Read Share what grows',
  )
  await page.keyboard.press('Home')
  await expect(page.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute(
    'value',
    '0',
  )
})
test('Vue reconnects one observer after keyed reorder, saved content, and density changes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Original = ResizeObserver
    ;(window as any).liveObservers = 0
    window.ResizeObserver = class extends Original {
      live = true
      constructor(callback: ResizeObserverCallback) {
        super(callback)
        ;(window as any).liveObservers++
      }
      disconnect() {
        super.disconnect()
        if (this.live) {
          ;(window as any).liveObservers--
          this.live = false
        }
      }
    }
  })
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => (window as any).liveObservers)).toBe(1)
  const reader = page.locator('[data-ui="reader"]'),
    navigation = page.getByRole('navigation', { name: 'Reading chapters' })
  await page
    .getByRole('region', { name: 'Editable chapters' })
    .getByRole('button', { name: '2. Find a patch of possibility', exact: true })
    .click()
  await page.getByRole('button', { name: 'Move earlier', exact: true }).click()
  await expect(reader.locator('[data-section]').first()).toHaveAttribute('data-section', 'find')
  await page
    .getByRole('textbox', { name: 'Chapter title', exact: true })
    .fill('A freshly arranged place')
  await page
    .getByRole('textbox', { name: 'Chapter text', exact: true })
    .fill('One paragraph.\n\nA second clear thought.')
  await page.getByRole('button', { name: 'Save chapter', exact: true }).click()
  await expect(
    navigation.getByRole('button', { name: 'Read A freshly arranged place', exact: true }),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Reading density', exact: true }).selectOption('compact')
  await navigation.getByRole('button', { name: 'Read Share what grows', exact: true }).click()
  await expect(navigation.locator('[aria-current="location"]')).toHaveAccessibleName(
    'Read Share what grows',
  )
  await expect.poll(() => page.evaluate(() => (window as any).liveObservers)).toBe(1)
  await page.reload()
  await expect(reader.locator('[data-section]').first()).toHaveAttribute('data-section', 'find')
  await expect(page.getByRole('combobox', { name: 'Reading density', exact: true })).toHaveValue(
    'compact',
  )
})
test('adding and confirmed deletion preserve preview geometry and replace template refs', async ({
  page,
}) => {
  await page.goto('/')
  const preview = page.locator('[data-ui="reading-preview"]'),
    before = (await preview.boundingBox())!.height
  await page.getByRole('button', { name: 'Add chapter', exact: true }).click()
  await expect(page.locator('[data-ui="reader"] [data-section]')).toHaveCount(6)
  await page
    .getByRole('navigation', { name: 'Reading chapters' })
    .getByRole('button', { name: 'Read A new little chapter', exact: true })
    .click()
  await expect(page.locator('[data-ui="reader"] [data-section]').last()).toBeFocused()
  await page.getByRole('button', { name: 'Remove chapter', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('[data-ui="reader"] [data-section]')).toHaveCount(6)
  await page.getByRole('button', { name: 'Remove chapter', exact: true }).click()
  await page
    .locator('dialog[open]')
    .getByRole('button', { name: 'Remove chapter', exact: true })
    .click()
  await expect(page.locator('[data-ui="reader"] [data-section]')).toHaveCount(5)
  expect((await preview.boundingBox())!.height).toBe(before)
  await page
    .getByRole('navigation', { name: 'Reading chapters' })
    .getByRole('button', { name: 'Read Plant something forgiving', exact: true })
    .click()
  await expect(page.locator('[data-ui="reader"] [data-section="plant"]')).toBeFocused()
})
test('portable HTML contains escaped paragraphs and matching native chapter anchors', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('textbox', { name: 'Chapter text', exact: true })
    .fill('<script>plain text</script>\n\nSecond paragraph.')
  await page.getByRole('button', { name: 'Save chapter', exact: true }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'HTML', exact: true }).click()
  const download = await pending,
    content = await readFile((await download.path())!, 'utf8')
  expect(download.suggestedFilename()).toMatch(/^SC-[A-F0-9]{8}\.html$/)
  const result = await page.evaluate((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return {
      count: doc.querySelectorAll('section').length,
      scripts: doc.querySelectorAll('script').length,
      text: doc.querySelector('section p')?.textContent,
      broken: [...doc.querySelectorAll('nav a')].filter(
        (a) => !doc.querySelector(a.getAttribute('href')!),
      ).length,
    }
  }, content)
  expect(result).toEqual({ count: 5, scripts: 0, text: '<script>plain text</script>', broken: 0 })
})
