import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:net';
import { chromium } from 'playwright-core';

const output = process.env.REVIEW_DIR || '/tmp/hgd1-auth-review';
await mkdir(output, { recursive: true });
const base = 'http://localhost:18080';
const auth = `${base}/realms/theme-test/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=${encodeURIComponent(base + '/')}&response_type=code&scope=openid`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/run/current-system/sw/bin/chromium', headless: true, args: ['--no-sandbox'] });
const failures = [];
const snapshots = [];
const emails = [];
const smtp = createServer(socket => {
  socket.write('220 theme-test ESMTP\r\n');
  let buffer = '', data = false, message = '';
  socket.on('data', chunk => {
    buffer += chunk.toString();
    let end;
    while ((end = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
      if (data) {
        if (line === '.') { data = false; emails.push(message); message = ''; socket.write('250 queued\r\n'); }
        else message += line + '\r\n';
      } else if (/^EHLO|^HELO/i.test(line)) socket.write('250 theme-test\r\n');
      else if (/^DATA/i.test(line)) { data = true; socket.write('354 send message\r\n'); }
      else if (/^QUIT/i.test(line)) socket.end('221 bye\r\n');
      else socket.write('250 ok\r\n');
    }
  });
});
await new Promise(resolve => smtp.listen(2525, '127.0.0.1', resolve));

async function pageFor(width = 1440, javaScriptEnabled = true) {
  const context = await browser.newContext({ viewport: { width, height: width < 640 ? 844 : 900 }, javaScriptEnabled });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && new URL(response.url()).pathname.startsWith('/resources/')) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(auth);
  await page.locator('#username').waitFor();
  return page;
}
async function screenshot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal overflow`);
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  snapshots.push(name);
}
async function login(page, username, password = 'preview-password-only') {
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#kc-login').click();
}
function totp() {
  // Keycloak stores the decoded OTP key, not its base32 display encoding.
  const key = Buffer.from('JBSWY3DPEHPK3PXP');
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', key).update(counter).digest();
  const offset = hash[19] & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
try {
  for (const width of [390, 768, 1440]) {
    const page = await pageFor(width);
    await screenshot(page, `signin-${width}`);
    const inputSize = await page.locator('#username').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    if (width < 640) assert.ok(inputSize >= 16, 'mobile must not zoom when focusing inputs');
    await page.context().close();
  }
  const page = await pageFor();
  await page.getByRole('button', { name: 'Show password' }).click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'text');
  assert.equal(await page.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await login(page, 'does-not-exist', 'not-a-real-password');
  await page.locator('#kc-feedback').waitFor();
  assert.equal(await page.locator('#username').getAttribute('aria-invalid'), 'true');
  await screenshot(page, 'signin-error');
  await page.goto(auth);
  await page.locator('[data-locale-select]').selectOption({ label: 'NL' });
  await page.getByRole('heading', { name: 'Inloggen' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'nl');
  await screenshot(page, 'signin-nl');
  await page.context().close();

  const otp = await pageFor();
  await login(otp, 'otp-preview');
  await otp.getByRole('heading', { name: 'Enter your code' }).waitFor();
  assert.equal(await otp.locator('.otp input').count(), 6);
  assert.ok(await otp.locator('#kc-login').isDisabled());
  await screenshot(otp, 'otp-desktop');
  await otp.setViewportSize({ width: 390, height: 844 });
  await screenshot(otp, 'otp-mobile');
  await otp.locator('#otp-digit-1').pressSequentially('123');
  assert.equal(await otp.locator('#otp').inputValue(), '123');
  await otp.keyboard.press('Backspace');
  assert.equal(await otp.locator('#otp').inputValue(), '12');
  await otp.locator('#otp-digit-1').evaluate(el => {
    const clipboardData = new DataTransfer(); clipboardData.setData('text', '000000');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  });
  assert.equal(await otp.locator('#otp').inputValue(), '000000');
  assert.ok(await otp.locator('#kc-login').isEnabled());
  await otp.locator('#kc-login').click();
  await otp.locator('#input-error').waitFor();
  await screenshot(otp, 'otp-error');
  await otp.locator('#otp-digit-1').evaluate((el, code) => {
    const clipboardData = new DataTransfer(); clipboardData.setData('text', code);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  }, totp());
  await otp.locator('#kc-login').click();
  await otp.waitForURL(url => url.pathname === '/' && url.searchParams.has('code'));
  await otp.context().close();

  const reset = await pageFor();
  await reset.getByRole('link', { name: 'Forgot?' }).click();
  await reset.getByRole('heading', { name: 'Reset your password' }).waitFor();
  await screenshot(reset, 'reset-desktop');
  await reset.setViewportSize({ width: 390, height: 844 });
  await screenshot(reset, 'reset-mobile');
  await reset.locator('#username').fill('preview@example.test');
  await reset.getByRole('button', { name: 'Send reset link' }).click();
  await reset.getByRole('heading', { name: 'Check your email' }).waitFor();
  await screenshot(reset, 'reset-sent');
  assert.equal(emails.length, 1, 'real reset email must be delivered');
  const decoded = emails[0].replace(/=\r\n/g, '').replace(/=3D/g, '=');
  const link = decoded.match(/http:\/\/localhost:18080\/realms\/theme-test\/login-actions\/action-token[^\s"<>]+/)[0].replaceAll('&amp;', '&');
  await reset.goto(link);
  await reset.locator('#password-new').waitFor();
  await screenshot(reset, 'update-password');
  await reset.locator('#password-new').fill('preview-password-only-new');
  await reset.locator('#password-confirm').fill('preview-password-only-new');
  await reset.locator('button[type="submit"], input[type="submit"]').click();
  await reset.waitForURL(url => url.pathname === '/' && url.searchParams.has('code'));
  await reset.context().close();

  const noJs = await pageFor(390, false);
  await login(noJs, 'preview', 'preview-password-only-new');
  await noJs.waitForURL(url => url.pathname === '/' && url.searchParams.has('code'));
  await noJs.context().close();
  const noJsOtp = await pageFor(390, false);
  await login(noJsOtp, 'otp-preview');
  // Keycloak rejects replay of the code already used by the enhanced OTP test.
  await new Promise(resolve => setTimeout(resolve, 30_000 - Date.now() % 30_000 + 300));
  await noJsOtp.locator('#otp').fill(totp());
  await noJsOtp.locator('#kc-login').click();
  await noJsOtp.waitForURL(url => url.pathname === '/' && url.searchParams.has('code'));
  await noJsOtp.context().close();

  const light = await pageFor();
  await light.locator('.auth').evaluate(el => { el.dataset.theme = 'light'; });
  await screenshot(light, 'signin-light');
  await light.context().close();
  assert.deepEqual(failures, [], 'no script errors or failed theme assets');
  console.log(`PASS: sign-in, errors, localization, OTP typing/paste/backspace + real verification, reset email + password update, no-JS sign-in/OTP, responsive layouts and light theme. ${snapshots.length} captures in ${output}.`);
} finally {
  await browser.close();
  await new Promise(resolve => smtp.close(resolve));
}
