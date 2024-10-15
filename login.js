const fs = require('fs');
const puppeteer = require('puppeteer');

function formatToISO(date) {
  return date.toISOString().replace('T', ' ').replace('Z', '').replace(/\.\d{3}Z/, '');
}

async function delayTime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 使用环境变量读取账户信息
const accountsJson = fs.readFileSync('.env.json', 'utf-8');
const accounts = JSON.parse(accountsJson);

(async () => {
  try {
    for (const account of accounts) {
      const { username, password, panelnum } = account;

      console.log(`正在尝试登录账号 ${username}...`);

      // 启动浏览器
      const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: false,
      });
      const page = await browser.newPage();

      let url = `https://panel${panelnum}.serv00.com/login/?next=/`;

      try {
        // 前往登录页面
        await page.goto(url);

        console.log(`前往 ${url} 成功`);

        // 清空用户名输入框的原有值
        const usernameInput = await page.waitForSelector('#id_username');
        if (usernameInput) {
          await usernameInput.click({ clickCount: 3 });
          await usernameInput.press('Backspace'); // 删除原来的值
        }

        console.log(`清空了用户名输入框的内容`);

        // 输入实际的账号和密码
        await page.type('#id_username', username);
        await page.type('#id_password', password);

        console.log(`已填写用户名 ${username} 和密码`);

        // 提交登录表单
        const loginButton = await page.waitForSelector('#submit');
        if (loginButton) {
          await loginButton.click();
        } else {
          throw new Error('无法找到登录按钮');
        }

        console.log(`提交了登录请求`);

        // 等待页面跳转，检查是否成功登录
        const isLoggedIn = await page.evaluate(() => {
          return document.querySelector('a[href="/logout/"]') !== null;
        });

        if (isLoggedIn) {
          const nowUtc = formatToISO(new Date());
          const nowBeijing = formatToISO(new Date().getTime() + 8 * 60 * 60 * 1000);
          console.log(`账号 ${username} 登录成功，北京时间：${nowBeijing}（UTC时间：${nowUtc})`);
        } else {
          console.error(`账号 ${username} 登录失败，请检查账户和密码是否正确`);
        }

      } catch (error) {
        console.error(`账号 ${username} 登录时出现错误: ${error}`);
      } finally {
        // 关闭页面和浏览器
        await page.close();
        await browser.close();

        const delay = Math.floor(Math.random() * 8000) + 1000;
        console.log(`等待 ${delay / 1000} 秒...`);
        await delayTime(delay);
      }
    }

    console.log('所有账号登录完成！');

  } catch (error) {
    console.error(`程序执行过程中出现错误: ${error}`);
  }
})();
