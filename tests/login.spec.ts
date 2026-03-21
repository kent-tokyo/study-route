import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

test.describe('ログイン機能', () => {
  test('未認証時に /map へアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto(`${BASE_URL}/map`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('間違ったパスワードでエラーが表示される', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', 'wrong_password');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=パスワードが正しくありません')).toBeVisible({ timeout: 10000 });
  });

  test('正しいパスワードで /map に遷移する', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', 'plactice_math_2024');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/map/, { timeout: 15000 });
    // マップページの要素が表示されていることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('ログイン後にページをリロードしてもセッションが維持される', async ({ page }) => {
    // ログイン
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', 'plactice_math_2024');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/map/, { timeout: 15000 });

    // リロード
    await page.reload();
    await expect(page).toHaveURL(/\/map/, { timeout: 10000 });
  });
});
