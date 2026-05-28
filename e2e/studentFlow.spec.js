import { test, expect } from '@playwright/test';

test.describe('Öğrenci Akışı (Student Flow)', () => {
  test('Öğrenci girişi yapıp aktif sınava tıklaması', async ({ page }) => {
    // 1. Mock API Responses
    // Öğrenci Login Mock
    await page.route('**/api/auth/login/student', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'fake-test-token',
          user: {
            id: 'test-student-1',
            studentNumber: '12345',
            fullName: 'Test Öğrencisi',
            className: '10A',
            role: 'student'
          }
        })
      });
    });

    // Sınavları Listeleme Mock
    await page.route('**/api/exams', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          exams: [
            {
              id: 'test-exam-1',
              title: 'Matematik Final Sınavı',
              status: 'active',
              type: 'file_upload',
              duration: 60,
              createdAt: new Date().toISOString(),
              startDate: new Date(Date.now() - 3600000).toISOString(),
              endDate: new Date(Date.now() + 3600000).toISOString(),
              targetType: 'class',
              targetClasses: ['10A'],
              isActive: true,
              antiCheatEnabled: true
            }
          ]
        })
      });
    });

    // Sınav Detayı Mock
    await page.route('**/api/exams/test-exam-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-exam-1',
            title: 'Matematik Final Sınavı',
            status: 'active',
            type: 'file_upload',
            duration: 60,
            allowPdf: true,
            allowImage: true,
            antiCheatEnabled: true
          }
        })
      });
    });

    // 2. Uygulamaya Git (Öğrenci Giriş Sayfasına)
    await page.goto('/ogrenci/giris');

    // 3. Öğrenci Numarası ve Şifre Gir (StudentLogin sayfasındaki class veya typlara göre)
    await page.fill('input[type="text"]', '12345');
    await page.fill('input[type="password"]', 'testpassword');
    
    // Öğrenci Girişi Butonuna tıkla
    await page.click('button:has-text("Giriş Yap")');

    // 4. Giriş Başarılı, Ana Ekrana yönlendirildiğini bekle
    await expect(page.locator('h2:has-text("Test Öğrencisi")')).toBeVisible({ timeout: 5000 });

    // 5. Aktif sınavı gör ve tıkla
    await expect(page.locator('text="Matematik Final Sınavı"')).toBeVisible();
    await page.click('button:has-text("Sınava Gir")');

    // 6. Anti-Cheat uyarı ekranının çıktığını doğrula (Çünkü web'den giriyoruz)
    await expect(page.locator('text=Güvenlik İhlali')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Bu sınav yüksek güvenlik (Anti-Cheat) gerektiriyor')).toBeVisible();
  });
});
