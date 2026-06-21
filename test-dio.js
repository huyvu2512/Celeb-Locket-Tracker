const puppeteer = require('puppeteer');

async function runTest() {
  console.log('🚀 Khởi chạy trình duyệt (có giao diện để quan sát)...');
  const browser = await puppeteer.launch({
    headless: false, // Mở UI để Sếp xem trực tiếp
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://locket-dio.com', []); // Từ chối tất cả quyền (camera/mic) để tránh popup cản đường

  const page = await browser.newPage();

  try {
    console.log('🌐 Truy cập trang đăng nhập...');
    await page.goto('https://locket-dio.com/login', { waitUntil: 'networkidle2' });

    console.log('🔑 Điền thông tin đăng nhập...');
    // Đợi input email (thường type="email" hoặc có id/name liên quan, nhưng mình sẽ tìm thẻ input type="email" hoặc input đầu tiên)
    const emailInput = await page.$('input[type="email"]') || await page.$('input[placeholder*="email" i]');
    if (emailInput) {
      await emailInput.type('luczaiam2512@gmail.com');
    } else {
      // Dùng phím tab nếu không tìm thấy selector cụ thể
      await page.keyboard.type('luczaiam2512@gmail.com');
    }

    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.type('Luczaiam2512.');
    } else {
      await page.keyboard.press('Tab');
      await page.keyboard.type('Luczaiam2512.');
    }

    console.log('🖱️ Ấn Đăng Nhập...');
    // Nút Đăng nhập: button[type="submit"] có chữ "Đăng Nhập"
    const loginBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Đăng Nhập'));
    });
    if (loginBtn) {
      await loginBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('⏳ Đợi load vào giao diện chính...');
    // Đợi xuất hiện nút "người bạn"
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('người bạn'));
    }, { timeout: 15000 });

    console.log('👥 Ấn nút "người bạn" để mở khung tìm kiếm...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('người bạn'));
      if (btn) btn.click();
    });

    console.log('🔍 Chờ ô tìm kiếm xuất hiện...');
    const searchInputSelector = 'input[placeholder="Thêm một người bạn mới..."]';
    await page.waitForSelector(searchInputSelector, { timeout: 5000 });

    const testUsername = 'saweetietest';
    console.log(`⌨️ Nhập username: ${testUsername}`);
    await page.type(searchInputSelector, testUsername, { delay: 100 });
    await new Promise(r => setTimeout(r, 500)); // Đợi React nhận data

    console.log('🖱️ Ấn nút "Tìm kiếm"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const searchBtn = btns.find(b => b.textContent.includes('Tìm kiếm'));
      if (searchBtn && !searchBtn.disabled) {
        searchBtn.click();
      }
    });

    console.log('⏳ Đợi kết quả tìm kiếm hiển thị...');
    try {
      // Đợi nút "Theo dõi" hoặc chữ "Đang chờ chấp nhận"
      await page.waitForFunction(() => {
        const text = document.body.textContent;
        return text.includes('Theo dõi') || text.includes('Đang chờ chấp nhận');
      }, { timeout: 10000 });
    } catch (e) {
      console.log('📸 Lỗi timeout, đang chụp ảnh màn hình...');
      await page.screenshot({ path: 'scratch/error_test_dio.png' });
      throw e;
    }

    console.log('👀 Kiểm tra trạng thái nút Theo dõi...');
    // Lấy thông tin nút "Theo dõi"
    const followStatus = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Theo dõi'));
      if (!btn) return { exists: false };
      return {
        exists: true,
        disabled: btn.disabled || btn.classList.contains('cursor-not-allowed'),
        text: btn.textContent
      };
    });

    if (followStatus.disabled) {
      console.log('❌ Locket báo: Đã full bạn (Nút bị mờ/disabled). Bỏ qua celeb này.');
    } else {
      console.log('✅ Nút khả dụng, tiến hành ấn Theo dõi...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.includes('Theo dõi') && b.offsetParent !== null);
        if (btn) {
           btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
      });

      console.log('⏳ Đợi phản hồi thành "Đang chờ chấp nhận"...');
      await page.waitForFunction(() => {
        return document.body.textContent.includes('Đang chờ chấp nhận');
      }, { timeout: 10000 });
      console.log('🎉 KẾT BẠN THÀNH CÔNG!');
    }

  } catch (error) {
    console.error('💥 Đã xảy ra lỗi trong quá trình test:', error);
  } finally {
    console.log('🛑 Đóng trình duyệt sau 5 giây...');
    setTimeout(async () => {
      await browser.close();
    }, 5000);
  }
}

runTest();
