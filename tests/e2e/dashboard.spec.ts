import { expect, test } from '@playwright/test'

test.describe('dashboard browser QA', () => {
  test('renders the dashboard and switches accessible views', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Signal\/Guide/)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: '신호를 보고, 근거를 고정하고, 가상으로 검증합니다.',
      })
    ).toBeVisible()

    const tablist = page.getByRole('tablist', { name: 'Signal Guide views' })
    await expect(tablist).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true'
    )

    await page.getByRole('tab', { name: 'Scanner' }).click()
    await expect(
      page.getByRole('tabpanel', { name: 'scanner content' })
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Scanner' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  test('keeps the login route reachable', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle('로그인')
    await expect(page.getByText('로그인', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible()
  })
})
