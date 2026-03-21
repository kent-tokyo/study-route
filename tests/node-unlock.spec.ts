import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const PASSWORD = process.env.LOGIN_PASSWORD || 'tanabe8888';

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/map/, { timeout: 15000 });
}

test.describe('ノード解放テスト', () => {
  test('counting完了後にnumber-systemsとset-theoryが利用可能になる', async ({ page }) => {
    await login(page);

    // 1. foundationsエリアをクリック
    await page.locator('text=基礎').first().click();
    await page.waitForTimeout(1500);

    // 2. 「数える」をクリック→学習ページへ
    await page.locator('text=数える').first().click();
    await page.waitForURL(/\/learn\/counting/, { timeout: 10000 });

    // 3. 「理解した」をクリック
    const completeBtn = page.locator('text=この概念を理解した');
    await expect(completeBtn).toBeVisible({ timeout: 30000 });
    await completeBtn.click();

    // 4. マップに戻る
    await page.waitForURL(/\/map/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 5. 進捗が保存されたか確認
    const progress = await page.evaluate(async () => {
      const res = await fetch('/api/progress');
      return res.json();
    });
    console.log('Progress:', JSON.stringify(progress));
    expect(progress.some((p: { nodeId: string; status: string }) =>
      p.nodeId === 'counting' && p.status === 'completed'
    )).toBe(true);

    // 6. foundationsエリアをクリック
    await page.locator('text=基礎').first().click();
    await page.waitForTimeout(1500);

    // 7. 「数の体系」をクリック → learn/number-systemsに遷移するはず
    await page.locator('text=数の体系').first().click();

    try {
      await page.waitForURL(/\/learn\/number-systems/, { timeout: 5000 });
      console.log('SUCCESS: 数の体系 is navigable');
    } catch {
      await page.screenshot({ path: 'test-results/unlock-fail.png', fullPage: true });
      console.log('FAIL: 数の体系 is NOT navigable. URL:', page.url());
      expect(false).toBe(true); // Force fail
    }

    // 8. マップに戻って集合論も確認
    await page.goto(`${BASE_URL}/map`);
    await page.waitForTimeout(1000);
    await page.locator('text=基礎').first().click();
    await page.waitForTimeout(1500);
    await page.locator('text=集合論').first().click();

    try {
      await page.waitForURL(/\/learn\/set-theory/, { timeout: 5000 });
      console.log('SUCCESS: 集合論 is navigable');
    } catch {
      await page.screenshot({ path: 'test-results/unlock-fail-set.png', fullPage: true });
      console.log('FAIL: 集合論 is NOT navigable. URL:', page.url());
      expect(false).toBe(true);
    }
  });
});
